import type { Metadata } from "next";
import { products, type Product, type ProductOffer } from "./products";
import { landingPageUrl, seoLandingPages } from "./seoLandingPages";

export const SITE_URL = "https://ecliptic.website";
export const SITE_NAME = "Ecliptic Store";
export const SITE_IMAGE = `${SITE_URL}/ecliptic-search-image.png`;
export const SITE_LOGO = `${SITE_URL}/icon.png`;
export const SITE_DESCRIPTION =
  "Ecliptic Store — интернет-магазин цифровых товаров, игровых пополнений и подписок в Приднестровье: Тирасполь, Бендеры, Рыбница и весь ПМР.";

const seoBrandKeywords = [
  SITE_NAME,
  "Ecliptic",
  "Ecliptic Store PMR",
  "Ecliptic Store Tiraspol",
  "Ecliptic Store Tiraspol PMR",
  "ecliptic.website",
  "эклиптик",
  "эклиптик стор",
  "эклиптик стор пмр",
  "эклиптик стор тирасполь",
  "эклиптик магазин",
  "эклиптик донат",
  "еклиптик стор",
  "еклиптик магазин",
  "эклиптик сторе",
  "эклиптик тсор",
  "эклиптек стор",
  "эклиптки стор",
  "эклиптикстор",
  "еклиптикстор",
  "жэклиптик стор",
  "ecliptic stor",
  "ecliptic stroe",
  "ecliptik store",
  "eclipticstore",
  "ecliptic shop",
];

const seoBaseKeywords = [
  ...seoBrandKeywords,
  "Ecliptic Store Приднестровье",
  "Ecliptic Store ПМР",
  "интернет магазин ПМР",
  "интернет магазин Приднестровье",
  "интернет магазин Тирасполь",
  "цифровые товары ПМР",
  "цифровые товары Приднестровье",
  "цифровые товары Тирасполь",
  "донат ПМР",
  "донат Приднестровье",
  "донат Тирасполь",
  "донат игры Тирасполь",
  "донат игр Тирасполь",
  "донат игры ПМР",
  "донат игр ПМР",
  "пополнение игр ПМР",
  "пополнение игр Приднестровье",
  "пополнение игр Тирасполь",
  "покупка подписок ПМР",
  "подписки Приднестровье",
  "подписки Тирасполь",
  "Telegram магазин ПМР",
  "Telegram магазин Тирасполь",
  "магазин цифровых товаров",
  "игровые товары онлайн",
  "игровой донат онлайн",
  "игровые пополнения онлайн",
  "оформление интернет покупок ПМР",
  "оформление интернет покупок Приднестровье",
  "оформление интернет покупок Тирасполь",
];

const seoRegions = [
  "ПМР",
  "Приднестровье",
  "Тирасполь",
  "Тирасроль",
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
  "дешево купить",
  "прайс",
];

const seoServiceWords = [
  "Steam",
  "Стим",
  "пополнение Steam",
  "пополнение Стим",
  "Telegram Premium",
  "Telegram Stars",
  "Telegram аккаунты",
  "Epic Games",
  "PlayStation",
  "Standoff 2",
  "Стандофф 2",
  "Standoff донат",
  "Тик ток",
  "TikTok",
  "PUBG Mobile",
  "Пабг мобайл",
  "Brawl Stars",
  "Бравл Старс",
  "Brawl Stars донат",
  "донат Бравл Старс",
  "Clash of Clans",
  "Клеш оф Кленс",
  "Clash Royale",
  "Клеш Рояль",
  "Mobile Legends",
  "Мобайл Легендс",
  "Roblox",
  "Роблокс",
  "робуксы",
  "Free Fire",
  "Фри Фаер",
  "Minecraft",
  "Майнкрафт",
  "GTA 5 RP",
  "Majestic RP",
  "Radmir RP",
  "Amazing RP",
  "Black Russia",
  "World of Tanks",
  "Мир танков",
  "Spotify Premium",
  "ChatGPT Plus",
  "Чат ГПТ плюс",
  "Discord Nitro",
  "Дискорд Нитро",
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

export function productOffers(product: Product) {
  return product.offers.filter((offer): offer is ProductOffer => offer.type !== "divider");
}

export function productHasPricedOffers(product: Product) {
  return productOffers(product).some((offer) => Number.isFinite(offer.priceRub) && offer.priceRub > 0);
}

export function productHasOrderForm(product: Product) {
  return ["steam", "epic-games-topup", "minecraft", "boosty", "twitch"].includes(product.slug);
}

export function productShouldBeIndexed(product: Product) {
  return productHasPricedOffers(product) || productHasOrderForm(product);
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

  return `${product.name} в Ecliptic Store: купить, оформить или пополнить онлайн в Приднестровье, Тирасполе и ПМР. Цифровые товары, подписки и игровые услуги.${suffix}`.slice(
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
    `${product.name} Тирасполь`,
    `${product.name} Ecliptic`,
    `${product.name} Эклиптик`,
    `купить ${product.name}`,
    `заказать ${product.name}`,
    `пополнить ${product.name}`,
    `донат ${product.name}`,
    `купить ${product.name} ПМР`,
    `купить ${product.name} Тирасполь`,
    `донат ${product.name} ПМР`,
    `донат ${product.name} Тирасполь`,
    ...productOffers(product).flatMap((offer) => [
      offer.label,
      `${product.name} ${offer.label}`,
      `купить ${product.name} ${offer.label}`,
      `${product.name} ${offer.label} ПМР`,
      `${product.name} ${offer.label} Тирасполь`,
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
      alternateName: seoBrandKeywords,
      url: SITE_URL,
      inLanguage: "ru",
      description: SITE_DESCRIPTION,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      alternateName: seoBrandKeywords,
      url: SITE_URL,
      logo: SITE_LOGO,
      image: SITE_IMAGE,
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
      alternateName: seoBrandKeywords,
      url: SITE_URL,
      logo: SITE_LOGO,
      image: SITE_IMAGE,
      description: SITE_DESCRIPTION,
      areaServed: ["Приднестровье", "ПМР", "Тирасполь", "Бендеры"],
      sameAs: [
        "https://t.me/Ecliptic_Store",
        "https://t.me/Ecliptic_Store_PMR",
        "https://t.me/Ecliptic_Store_Reviews",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${SITE_NAME} search directions`,
      itemListElement: seoLandingPages.map((page, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: page.h1,
        url: landingPageUrl(page.slug),
      })),
    },
  ];
}

export function buildProductJsonLd(product: Product) {
  const pricedOffers = productOffers(product).filter((offer) => Number.isFinite(offer.priceRub) && offer.priceRub > 0);
  const productUrl = `${SITE_URL}/products/${product.slug}`;

  if (pricedOffers.length === 0) {
    return null;
  }

  const merchantReturnPolicy = {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "MD",
    returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
  };

  const shippingDetails = {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: 0,
      currency: "RUB",
    },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: "MD",
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 0,
        maxValue: 1,
        unitCode: "d",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 0,
        maxValue: 1,
        unitCode: "d",
      },
    },
  };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: [SITE_IMAGE],
    description: buildProductDescription(product),
    sku: product.slug,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    hasMerchantReturnPolicy: merchantReturnPolicy,
    offers: pricedOffers.map((offer) => ({
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "RUB",
      price: offer.priceRub,
      priceSpecification: {
        "@type": "PriceSpecification",
        price: offer.priceRub,
        priceCurrency: "RUB",
      },
      name: offer.label,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      shippingDetails,
      hasMerchantReturnPolicy: merchantReturnPolicy,
    })),
  };
}

export function stringifyJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function buildProductMetadata(product: Product): Metadata {
  const title = `${product.name} купить онлайн в ПМР - Эклиптик Стор`;
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
      index: productShouldBeIndexed(product),
      follow: true,
    },
  };
}
