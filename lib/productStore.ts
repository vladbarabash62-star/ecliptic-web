import { products, type Product, type ProductOffer } from "./products";
import { redisPipeline } from "./security";

const PRODUCTS_KEY = "ecliptic:products:overrides";
export const PRODUCTS_CACHE_TAG = "ecliptic-products";
const FALLBACK_ICON =
  "https://static.vecteezy.com/system/resources/previews/023/986/562/non_2x/telegram-logo-telegram-logo-transparent-telegram-icon-transparent-free-free-png.png";

type ProductOverride = Pick<Product, "name" | "icon" | "offers"> & {
  iconScale?: number;
  offerIcon?: string;
  messageTemplate?: string;
};

type ProductOverrides = Record<string, ProductOverride>;

function hasDividers(offers: Product["offers"]) {
  return offers.some((offer) => offer.type === "divider");
}

function mergeOffersWithBaseDividers(baseOffers: Product["offers"], overrideOffers: Product["offers"]) {
  if (!hasDividers(baseOffers) || hasDividers(overrideOffers)) return overrideOffers;

  const usedIndexes = new Set<number>();
  const nextOffers = baseOffers.map((baseOffer) => {
    if (baseOffer.type === "divider") return baseOffer;

    const overrideIndex = overrideOffers.findIndex(
      (offer, index) => offer.type !== "divider" && !usedIndexes.has(index) && offer.label === baseOffer.label
    );

    if (overrideIndex === -1) return baseOffer;
    usedIndexes.add(overrideIndex);
    return overrideOffers[overrideIndex];
  });

  const extraOffers = overrideOffers.filter((offer, index) => !usedIndexes.has(index));
  return [...nextOffers, ...extraOffers];
}

function normalizeOverrides(value: unknown): ProductOverrides {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value as ProductOverrides).filter(([, product]) => {
      return Boolean(
        product &&
          typeof product.name === "string" &&
          typeof product.icon === "string" &&
          Array.isArray(product.offers)
      );
    })
  );
}

function trimLimit(value: unknown, fallback: string, limit: number) {
  if (typeof value !== "string") return fallback;
  return value
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, limit) || fallback;
}

function trimMultilineLimit(value: unknown, fallback: string, limit: number) {
  if (typeof value !== "string") return fallback;
  return value
    .replace(/[<>]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, limit) || fallback;
}

function safeIconUrl(value: unknown) {
  const icon = trimLimit(value, FALLBACK_ICON, 280_000);

  if (/^data:image\/(png|jpeg|jpg|webp);base64,[a-z0-9+/=]+$/i.test(icon)) {
    return icon.length <= 280_000 ? icon : FALLBACK_ICON;
  }

  if (/^\/[a-z0-9/_.,@%+-]+\.(png|jpe?g|webp|svg)$/i.test(icon)) {
    return icon;
  }

  try {
    const url = new URL(icon);
    return url.protocol === "https:" || url.protocol === "http:" ? icon : FALLBACK_ICON;
  } catch {
    return FALLBACK_ICON;
  }
}

function safeOptionalIconUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;

  const icon = safeIconUrl(value);
  return icon === FALLBACK_ICON ? undefined : icon;
}

function safeScale(value: unknown, fallback = 1, min = 0.45, max = 2.4) {
  const scale = Number(value);
  if (!Number.isFinite(scale)) return fallback;
  return Math.min(max, Math.max(min, scale));
}

function safeSlug(value: unknown) {
  return trimLimit(value, "", 64)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeOfferItem(item: Product["offers"][number]) {
  if (item.type === "divider") {
    const title = trimLimit(item.title, "", 80);
    if (!title) return null;

    return {
      type: "divider" as const,
      title,
      description: trimLimit(item.description, "", 180),
    };
  }

  if (!("label" in item) || !item.label.trim()) return null;

  return {
    label: trimLimit(item.label, "Вариант", 120),
    priceRub: Math.max(0, Math.min(999999, Number(item.priceRub) || 0)),
    icon: safeOptionalIconUrl((item as ProductOffer).icon),
    iconScale: safeScale((item as ProductOffer).iconScale),
    messageTemplate: trimMultilineLimit(item.messageTemplate, "", 1000),
  };
}

type ProductReadOptions = {
  cached?: boolean;
};

async function readOverrides(options: ProductReadOptions = {}): Promise<ProductOverrides> {
  const result = await redisPipeline(
    [["GET", PRODUCTS_KEY]],
    options.cached
      ? {
          cache: "force-cache",
          next: {
            tags: [PRODUCTS_CACHE_TAG],
            revalidate: 3600,
          },
        }
      : undefined
  );
  const raw = result?.[0]?.result;
  if (!raw || typeof raw !== "string") return {};

  try {
    return normalizeOverrides(JSON.parse(raw));
  } catch {
    return {};
  }
}

export async function getProducts(options: ProductReadOptions = {}) {
  const overrides: ProductOverrides = await readOverrides(options).catch(() => ({}));
  const usedSlugs = new Set<string>();
  const baseBySlug = new Map(products.map((product) => [product.slug, product]));
  const orderedProducts = Object.entries(overrides).map(([slug, override]) => {
    usedSlugs.add(slug);
    const baseProduct = baseBySlug.get(slug);

    if (baseProduct) {
      return {
        ...baseProduct,
        ...override,
        offers: mergeOffersWithBaseDividers(baseProduct.offers, override.offers),
        slug: baseProduct.slug,
      };
    }

    return {
      slug,
      ...override,
    };
  });
  const missingBaseProducts = products.filter((product) => !usedSlugs.has(product.slug));

  return [...orderedProducts, ...missingBaseProducts];
}

export async function getProductBySlug(slug: string, options: ProductReadOptions = {}) {
  const currentProducts = await getProducts(options);
  return currentProducts.find((product) => product.slug === slug);
}

export async function saveProducts(nextProducts: Product[]) {
  const overrides: ProductOverrides = {};
  const usedSlugs = new Set<string>();

  for (const product of nextProducts.slice(0, 90)) {
    const slug = safeSlug(product.slug);
    if (!slug || usedSlugs.has(slug)) continue;
    usedSlugs.add(slug);

    overrides[slug] = {
      name: trimLimit(product.name, "Товар", 90),
      icon: safeIconUrl(product.icon),
      iconScale: safeScale(product.iconScale, 1, 0.6, 1.8),
      offerIcon: safeOptionalIconUrl(product.offerIcon),
      messageTemplate: trimMultilineLimit(product.messageTemplate, "", 1000),
      offers: product.offers
        .slice(0, 120)
        .map(normalizeOfferItem)
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    };
  }

  await redisPipeline([["SET", PRODUCTS_KEY, JSON.stringify(overrides)]]);
  return getProducts();
}
