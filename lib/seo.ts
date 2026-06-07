import type { Metadata } from "next";
import { products, type Product, type ProductOffer } from "./products";

export const SITE_URL = "https://ecliptic.website";
export const SITE_NAME = "Ecliptic Store";
export const SITE_DESCRIPTION =
  "Ecliptic Store — интернет магазин. Оформление интернет-покупок в Приднестровье.";

const seoBaseKeywords = [
  SITE_NAME,
  "ecliptic.website",
  "Ecliptic Store Приднестровье",
  "Ecliptic Store ПМР",
  "интернет магазин ПМР",
  "интернет магазин Приднестровье",
  "цифровые товары ПМР",
  "цифровые товары Приднестровье",
  "донат ПМР",
  "донат Приднестровье",
  "пополнение игр ПМР",
  "пополнение игр Приднестровье",
  "покупка подписок ПМР",
  "подписки Приднестровье",
  "Telegram магазин ПМР",
  "магазин цифровых товаров",
  "игровые товары онлайн",
  "оформление интернет покупок ПМР",
  "оформление интернет покупок Приднестровье",
];

const seoRegions = [
  "ПМР",
  "Приднестровье",
  "Тирасполь",
  "Бендеры",
  "Рыбница",
  "Дубоссары",
  "Слободзея",
  "Молдова",
  "онлайн",
];

const seoActions = [
  "купить",
  "заказать",
  "оформить",
  "пополнить",
  "пополнение",
  "донат",
  "подписка",
  "цена",
  "магазин",
  "быстро купить",
  "купить онлайн",
  "оформить онлайн",
];

const seoServiceWords = [
  "Steam",
  "Telegram Premium",
  "Telegram Stars",
  "Telegram аккаунты",
  "Epic Games",
  "PlayStation",
  "Standoff 2",
  "Тик ток",
  "TikTok",
  "PUBG Mobile",
  "Brawl Stars",
  "Clash of Clans",
  "Clash Royale",
  "Mobile Legends",
  "Roblox",
  "Free Fire",
  "Minecraft",
  "GTA 5 RP",
  "Majestic RP",
  "Radmir RP",
  "Amazing RP",
  "Black Russia",
  "World of Tanks",
  "Spotify Premium",
  "ChatGPT Plus",
  "Discord Nitro",
  "Fortnite",
  "Genshin Impact",
  "Valorant",
  "Twitch",
  "Boosty",
  ...products.map((product) => product.name),
];

function unique(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.replace(/\s+/g, " ").trim())
        .filter(Boolean)
    )
  );
}

export function buildSeoKeywords(limit = 1000) {
  const keywords: string[] = [...seoBaseKeywords, ...seoServiceWords];
  const services = unique(seoServiceWords);

  for (const service of services) {
    keywords.push(`${service} ${SITE_NAME}`);
    keywords.push(`${service} ecliptic.website`);

    for (const region of seoRegions) {
      keywords.push(`${service} ${region}`);
      keywords.push(`${SITE_NAME} ${service} ${region}`);

      for (const action of seoActions) {
        keywords.push(`${action} ${service} ${region}`);
      }
    }
  }

  return unique(keywords).slice(0, limit);
}

function productOffers(product: Product) {
  return product.offers.filter((offer): offer is ProductOffer => offer.type !== "divider");
}

function productOfferLabels(product: Product) {
  return productOffers(product)
    .map((offer) => offer.label)
    .slice(0, 8)
    .join(", ");
}

export function buildProductDescription(product: Product) {
  const labels = productOfferLabels(product);
  const suffix = labels ? ` Доступные варианты: ${labels}.` : "";

  return `${product.name} в Ecliptic Store: оформление интернет-покупок, цифровых товаров, подписок и игровых услуг в Приднестровье.${suffix}`.slice(
    0,
    260
  );
}

export function buildProductKeywords(product: Product) {
  return unique([
    product.name,
    product.slug,
    `${product.name} Ecliptic Store`,
    `${product.name} ПМР`,
    `${product.name} Приднестровье`,
    `купить ${product.name}`,
    `заказать ${product.name}`,
    `пополнить ${product.name}`,
    `донат ${product.name}`,
    ...productOffers(product).flatMap((offer) => [
      offer.label,
      `${product.name} ${offer.label}`,
      `купить ${product.name} ${offer.label}`,
    ]),
    ...buildSeoKeywords(120),
  ]).slice(0, 220);
}

export function buildStoreJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "ru",
      description: SITE_DESCRIPTION,
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      sameAs: [
        "https://t.me/Ecliptic_Store",
        "https://t.me/Ecliptic_Store_PMR",
        "https://t.me/Ecliptic_Store_Reviews",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Store",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      areaServed: ["Приднестровье", "ПМР", "Тирасполь", "Бендеры"],
      sameAs: [
        "https://t.me/Ecliptic_Store",
        "https://t.me/Ecliptic_Store_PMR",
        "https://t.me/Ecliptic_Store_Reviews",
      ],
    },
  ];
}

export function buildProductJsonLd(product: Product) {
  const offers = productOffers(product);
  const prices = offers.map((offer) => offer.priceRub).filter((price) => Number.isFinite(price) && price > 0);
  const productUrl = `${SITE_URL}/products/${product.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.icon,
    description: buildProductDescription(product),
    sku: product.slug,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    offers:
      prices.length > 0
        ? {
            "@type": "AggregateOffer",
            url: productUrl,
            priceCurrency: "RUB",
            lowPrice: Math.min(...prices),
            highPrice: Math.max(...prices),
            offerCount: prices.length,
            availability: "https://schema.org/InStock",
          }
        : {
            "@type": "Offer",
            url: productUrl,
            priceCurrency: "RUB",
            availability: "https://schema.org/InStock",
          },
  };
}

export function stringifyJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function buildProductMetadata(product: Product): Metadata {
  const title = `${product.name} купить онлайн`;
  const description = buildProductDescription(product);
  const url = `${SITE_URL}/products/${product.slug}`;

  return {
    title,
    description,
    keywords: buildProductKeywords(product),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${product.name} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      locale: "ru_RU",
      type: "website",
      images: [
        {
          url: product.icon,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [product.icon],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
