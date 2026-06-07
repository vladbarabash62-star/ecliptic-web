import { products, type Product, type ProductOffer } from "./products";
import { redisPipeline } from "./security";

const PRODUCTS_KEY = "ecliptic:products:overrides";
export const PRODUCTS_CACHE_TAG = "ecliptic-products";
const FALLBACK_ICON =
  "https://static.vecteezy.com/system/resources/previews/023/986/562/non_2x/telegram-logo-telegram-logo-transparent-telegram-icon-transparent-free-free-png.png";

type ProductOverride = Pick<Product, "name" | "icon" | "offers"> & {
  baseSlug?: string;
  iconScale?: number;
  offerIcon?: string;
  messageTemplate?: string;
};

type ProductOverrides = Record<string, ProductOverride>;
type ProductStorage = {
  hiddenBaseSlugs: string[];
  overrides: ProductOverrides;
};

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

function normalizeHiddenBaseSlugs(value: unknown) {
  if (!Array.isArray(value)) return [];

  const baseSlugs = new Set(products.map((product) => product.slug));
  return Array.from(new Set(value.map((slug) => safeSlug(slug)).filter((slug) => baseSlugs.has(slug))));
}

function normalizeProductStorage(value: unknown): ProductStorage {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { hiddenBaseSlugs: [], overrides: {} };
  }

  const stored = value as { hiddenBaseSlugs?: unknown; overrides?: unknown };
  if (stored.overrides && typeof stored.overrides === "object" && !Array.isArray(stored.overrides)) {
    return {
      hiddenBaseSlugs: normalizeHiddenBaseSlugs(stored.hiddenBaseSlugs),
      overrides: normalizeOverrides(stored.overrides),
    };
  }

  return {
    hiddenBaseSlugs: [],
    overrides: normalizeOverrides(value),
  };
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

function safeScale(value: unknown, fallback = 1, min = 0, max = 2) {
  const normalized = typeof value === "string" ? value.trim().replace(",", ".") : value;
  if (normalized === "") return fallback;
  const scale = Number(normalized);
  if (!Number.isFinite(scale)) return fallback;
  return Math.min(max, Math.max(min, scale));
}

function safeSlug(value: unknown) {
  return trimLimit(value, "", 64)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function offerSignature(offers: Product["offers"] = []) {
  return offers
    .filter((offer) => offer.type !== "divider")
    .map((offer) => offer.label.trim().toLowerCase())
    .filter(Boolean)
    .join("|");
}

function inferBaseProduct(product: Pick<Product, "name" | "icon" | "offers">, usedBaseSlugs = new Set<string>()) {
  const productIcon = trimLimit(product.icon, "", 280_000).trim().toLowerCase();
  const productOffers = offerSignature(product.offers);
  const productName = trimLimit(product.name, "", 90).trim().toLowerCase();

  return products.find((baseProduct) => {
    if (usedBaseSlugs.has(baseProduct.slug)) return false;

    const iconMatches = productIcon && productIcon === baseProduct.icon.trim().toLowerCase();
    const offersMatch = productOffers && productOffers === offerSignature(baseProduct.offers);
    const nameMatches = productName && productName === baseProduct.name.trim().toLowerCase();

    return (iconMatches && offersMatch) || (nameMatches && (iconMatches || offersMatch));
  });
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
    iconScale: safeScale((item as ProductOffer).iconScale, 1, 0, 2),
    messageTemplate: trimMultilineLimit(item.messageTemplate, "", 1000),
  };
}

type ProductReadOptions = {
  cached?: boolean;
};

async function readProductStorage(options: ProductReadOptions = {}): Promise<ProductStorage> {
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
  if (!raw || typeof raw !== "string") return { hiddenBaseSlugs: [], overrides: {} };

  try {
    return normalizeProductStorage(JSON.parse(raw));
  } catch {
    return { hiddenBaseSlugs: [], overrides: {} };
  }
}

export async function getProducts(options: ProductReadOptions = {}) {
  const storage = await readProductStorage(options).catch(() => ({ hiddenBaseSlugs: [], overrides: {} }));
  const hiddenBaseSlugs = new Set(storage.hiddenBaseSlugs);
  const overrides = storage.overrides;
  const usedSlugs = new Set<string>();
  const usedBaseSlugs = new Set<string>();
  const baseBySlug = new Map(products.map((product) => [product.slug, product]));
  const orderedProducts = Object.entries(overrides)
    .map(([rawSlug, override]) => {
      const slug = safeSlug(rawSlug);
      if (!slug || usedSlugs.has(slug)) return null;
      usedSlugs.add(slug);

      const baseProduct = baseBySlug.get(safeSlug(override.baseSlug)) || baseBySlug.get(slug) || inferBaseProduct(override, usedBaseSlugs);

      if (baseProduct) {
        if (usedBaseSlugs.has(baseProduct.slug)) return null;
        usedBaseSlugs.add(baseProduct.slug);
        return {
          ...baseProduct,
          ...override,
          baseSlug: baseProduct.slug,
          offers: mergeOffersWithBaseDividers(baseProduct.offers, override.offers),
          slug,
        };
      }

      return {
        slug,
        ...override,
      };
    })
    .filter((product): product is Product => Boolean(product));
  const missingBaseProducts = products
    .filter((product) => !usedBaseSlugs.has(product.slug) && !hiddenBaseSlugs.has(product.slug))
    .map((product) => ({ ...product, baseSlug: product.slug }));

  return [...orderedProducts, ...missingBaseProducts];
}

export async function getProductBySlug(slug: string, options: ProductReadOptions = {}) {
  const currentProducts = await getProducts(options);
  return currentProducts.find((product) => product.slug === slug);
}

export async function saveProducts(nextProducts: Product[]) {
  const overrides: ProductOverrides = {};
  const usedSlugs = new Set<string>();
  const usedBaseSlugs = new Set<string>();
  const baseBySlug = new Map(products.map((product) => [product.slug, product]));

  for (const product of nextProducts.slice(0, 90)) {
    const slug = safeSlug(product.slug);
    if (!slug || usedSlugs.has(slug)) continue;
    usedSlugs.add(slug);
    const baseProduct = baseBySlug.get(safeSlug(product.baseSlug)) || baseBySlug.get(slug) || inferBaseProduct(product, usedBaseSlugs);
    if (baseProduct && usedBaseSlugs.has(baseProduct.slug)) continue;

    overrides[slug] = {
      ...(baseProduct ? { baseSlug: baseProduct.slug } : {}),
      name: trimLimit(product.name, "Товар", 90),
      icon: safeIconUrl(product.icon),
      iconScale: safeScale(product.iconScale, 1, 0, 2),
      offerIcon: safeOptionalIconUrl(product.offerIcon),
      messageTemplate: trimMultilineLimit(product.messageTemplate, "", 1000),
      offers: product.offers
        .slice(0, 120)
        .map(normalizeOfferItem)
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    };

    if (baseProduct) usedBaseSlugs.add(baseProduct.slug);
  }

  const hiddenBaseSlugs = products.filter((product) => !usedBaseSlugs.has(product.slug)).map((product) => product.slug);

  await redisPipeline([["SET", PRODUCTS_KEY, JSON.stringify({ hiddenBaseSlugs, overrides, version: 2 })]]);
  return getProducts();
}
