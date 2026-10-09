import { products } from "./products";

const LANDING_SITE_URL = "https://ecliptic.website";

export type SeoLandingPage = {
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  productSlug?: string;
  phrases: string[];
  services: string[];
};

const manualSeoLandingPages: SeoLandingPage[] = [
  {
    slug: "donat-pmr",
    title: "Донат ПМР - игровые пополнения в Ecliptic Store",
    description:
      "Донат в ПМР: Standoff 2, Roblox, Brawl Stars, Steam, PUBG Mobile, Telegram Stars и другие игровые пополнения через Ecliptic Store.",
    h1: "Донат ПМР",
    intro:
      "Ecliptic Store помогает оформить игровые пополнения и цифровые товары для покупателей из ПМР, Тирасполя, Бендер и всего Приднестровья.",
    phrases: [
      "донат пмр",
      "донат pmr",
      "donat pmr",
      "donate pmr",
      "задонатить в пмр",
      "пмр задонатить",
      "пмр задонатить в игру",
      "донат приднестровье",
      "донат тирасполь",
      "игровой донат пмр",
      "пополнение игр пмр",
      "купить донат пмр",
      "донат онлайн пмр",
    ],
    services: ["Standoff 2", "Roblox", "Brawl Stars", "Steam", "PUBG Mobile", "Telegram Stars", "PlayStation"],
  },
  {
    slug: "donat-pmr-online",
    title: "Донат PMR и ПМР - игровые пополнения Ecliptic Store",
    description:
      "Донат PMR и ПМР: игровые пополнения, Telegram Stars, Steam, Black Russia, Roblox и подписки через Ecliptic Store.",
    h1: "Донат PMR и ПМР",
    intro:
      "Эта страница помогает найти Ecliptic Store по запросам с разными формулировками: донат PMR, донат ПМР, задонатить в игру в ПМР.",
    phrases: [
      "донат pmr",
      "donat pmr",
      "donate pmr",
      "pmr donate",
      "донат пмр",
      "пмр задонатить",
      "пмр задонатить в игру",
      "задонатить в пмр",
      "купить донат pmr",
    ],
    services: ["Telegram Stars", "Steam", "Black Russia", "Roblox", "Brawl Stars", "Standoff 2", "PUBG Mobile"],
  },
  {
    slug: "pmr-zvezdy-telegram",
    title: "ПМР звёзды Telegram - купить Telegram Stars",
    description:
      "ПМР звёзды Telegram: купить Telegram Stars, оформить звезды Телеграм и Telegram Premium через Ecliptic Store.",
    h1: "ПМР звёзды Telegram",
    intro:
      "Страница под запросы про звёзды Telegram, Telegram Stars, телеграм звезды и цифровые товары Telegram в ПМР.",
    productSlug: "telegram-stars",
    phrases: [
      "пмр звезды",
      "пмр звёзды",
      "звезды телеграм",
      "звёзды телеграм",
      "звезды telegram",
      "звёзды telegram",
      "купить звезды телеграм",
      "купить звёзды telegram пмр",
      "telegram stars пмр",
    ],
    services: ["Telegram Stars", "звёзды Telegram", "Telegram Premium", "Telegram аккаунты"],
  },
  {
    slug: "telegram-premium-pmr-kupit",
    title: "Телеграм Премиум ПМР - Telegram Premium",
    description:
      "Телеграм Премиум в ПМР: купить Telegram Premium, оформить подписку и цифровые товары Telegram через Ecliptic Store.",
    h1: "Телеграм Премиум ПМР",
    intro:
      "Страница для запросов Telegram Premium, Телеграм Премиум, премиум телеграм и подписки Telegram в ПМР.",
    productSlug: "telegram-premium",
    phrases: [
      "телеграм премиум",
      "телеграм премиум пмр",
      "telegram premium",
      "telegram premium пмр",
      "купить телеграм премиум",
      "купить telegram premium пмр",
      "премиум телеграм пмр",
    ],
    services: ["Telegram Premium", "Telegram Stars", "Telegram аккаунты"],
  },
  {
    slug: "black-russia-donat-pmr",
    title: "Black Russia донат ПМР - пополнение Black Russia",
    description:
      "Black Russia донат в ПМР: пополнение Black Russia, игровые товары и RP-донат через Ecliptic Store.",
    h1: "Black Russia донат ПМР",
    intro:
      "Страница для запросов Black Russia, Блэк Раша, донат Black Russia и игровые пополнения в ПМР.",
    productSlug: "black-russia",
    phrases: [
      "black russia пмр",
      "black russia донат пмр",
      "блэк раша пмр",
      "блэк раша донат пмр",
      "донат black russia",
      "пополнение black russia пмр",
      "black russia тирасполь",
    ],
    services: ["Black Russia", "донат Black Russia", "игровые пополнения", "RP донат"],
  },
  {
    slug: "donat-pridnestrovie",
    title: "Донат Приднестровье - пополнение игр и подписок",
    description:
      "Игровой донат и цифровые подписки в Приднестровье: Steam, Roblox, Standoff 2, Brawl Stars, Telegram Premium и другие сервисы.",
    h1: "Донат в Приднестровье",
    intro:
      "На странице собраны основные направления Ecliptic Store для тех, кто ищет донат, пополнение игр и цифровые услуги в Приднестровье.",
    phrases: [
      "донат приднестровье",
      "пополнить игру приднестровье",
      "купить донат приднестровье",
      "игровые пополнения приднестровье",
      "подписки приднестровье",
      "цифровые товары приднестровье",
    ],
    services: ["Steam", "Roblox", "Standoff 2", "Brawl Stars", "Discord Nitro", "Spotify Premium", "YouTube Premium"],
  },
  {
    slug: "standoff-2-donat-pmr",
    title: "Standoff 2 донат ПМР - купить голду Standoff 2",
    description:
      "Standoff 2 донат в ПМР: купить голду, оформить пополнение и перейти к заказу через Ecliptic Store.",
    h1: "Standoff 2 донат ПМР",
    intro:
      "Если ищут голду Standoff 2 в ПМР или Приднестровье, эта страница ведет к актуальному разделу Standoff 2 на сайте.",
    productSlug: "standoff-2",
    phrases: [
      "standoff 2 донат пмр",
      "стандофф 2 донат пмр",
      "купить голду пмр",
      "голда стандофф 2 пмр",
      "задонатить в стандофф пмр",
      "standoff 2 приднестровье",
      "стандофф голда тирасполь",
    ],
    services: ["100 голды", "500 голды", "1000 голды", "1500 голды", "2000 голды", "3000 голды"],
  },
  {
    slug: "kupit-goldu-pmr",
    title: "Купить голду ПМР - Standoff 2 и игровые пополнения",
    description:
      "Купить голду в ПМР для Standoff 2 и оформить другие игровые пополнения через Ecliptic Store.",
    h1: "Купить голду ПМР",
    intro:
      "Страница для запросов про покупку голды и игровые пополнения в ПМР, Тирасполе и Приднестровье.",
    productSlug: "standoff-2",
    phrases: [
      "купить голду пмр",
      "купить голду тирасполь",
      "голда пмр",
      "голда стандофф",
      "голда standoff 2",
      "донат голда пмр",
    ],
    services: ["Standoff 2", "голда", "игровой донат", "пополнение игр"],
  },
  {
    slug: "robuxy-pmr",
    title: "Робуксы ПМР - купить Robux для Roblox",
    description:
      "Робуксы в ПМР и Приднестровье: купить Robux для Roblox через Ecliptic Store.",
    h1: "Робуксы ПМР",
    intro:
      "Страница для тех, кто ищет робуксы, Roblox донат и пополнение баланса Roblox в ПМР.",
    productSlug: "roblox",
    phrases: [
      "робуксы пмр",
      "robux пмр",
      "робуксы приднестровье",
      "купить робуксы пмр",
      "роблокс донат пмр",
      "roblox приднестровье",
      "робуксы тирасполь",
    ],
    services: ["40 Robux", "80 Robux", "200 Robux", "400 Robux", "800 Robux", "Roblox Premium"],
  },
  {
    slug: "steam-popolnenie-pmr",
    title: "Пополнение Steam ПМР - купить баланс Steam",
    description:
      "Пополнение Steam в ПМР: оформить баланс Steam онлайн через Ecliptic Store.",
    h1: "Пополнение Steam ПМР",
    intro:
      "Ecliptic Store помогает оформить пополнение Steam для пользователей из ПМР, Тирасполя и Приднестровья.",
    productSlug: "steam",
    phrases: [
      "пополнение steam пмр",
      "пополнить стим пмр",
      "steam тирасполь",
      "стим донат пмр",
      "купить баланс steam пмр",
      "steam приднестровье",
    ],
    services: ["Steam", "баланс Steam", "пополнение Steam", "игры Steam"],
  },
  {
    slug: "brawl-stars-donat-pmr",
    title: "Brawl Stars донат ПМР - гемы и Brawl Pass",
    description:
      "Brawl Stars донат в ПМР: гемы, Brawl Pass, Brawl Pass Plus и другие варианты через Ecliptic Store.",
    h1: "Brawl Stars донат ПМР",
    intro:
      "Страница для запросов про Brawl Stars, гемы и Brawl Pass в ПМР и Приднестровье.",
    productSlug: "brawl-stars",
    phrases: [
      "brawl stars донат пмр",
      "бравл старс донат пмр",
      "гемы бравл старс пмр",
      "brawl pass пмр",
      "купить гемы brawl stars",
      "бравл старс тирасполь",
    ],
    services: ["Brawl Pass", "Brawl Pass Plus", "Pro Pass", "гемы Brawl Stars"],
  },
  {
    slug: "telegram-stars-pmr",
    title: "Telegram Stars ПМР - купить звезды Telegram",
    description:
      "Telegram Stars в ПМР: купить звезды Telegram и оформить заказ через Ecliptic Store.",
    h1: "Telegram Stars ПМР",
    intro:
      "Страница для пользователей, которые ищут Telegram Stars, звезды Telegram и цифровые товары Telegram в ПМР.",
    productSlug: "telegram-stars",
    phrases: [
      "telegram stars пмр",
      "телеграм старс пмр",
      "звезды telegram пмр",
      "купить звезды телеграм",
      "telegram stars тирасполь",
      "телеграм донат пмр",
    ],
    services: ["Telegram Stars", "звезды Telegram", "Telegram Premium", "Telegram аккаунты"],
  },
  {
    slug: "playstation-psn-pmr",
    title: "PlayStation PSN ПМР - карты PS Store и PS Plus",
    description:
      "PlayStation в ПМР: PSN, PS Store, PS Plus Турция и карты пополнения через Ecliptic Store.",
    h1: "PlayStation и PSN ПМР",
    intro:
      "Страница для запросов про PlayStation, PSN, PS Store и PS Plus в ПМР и Приднестровье.",
    productSlug: "playstation",
    phrases: [
      "playstation пмр",
      "psn пмр",
      "ps store пмр",
      "ps plus пмр",
      "playstation тирасполь",
      "купить psn карту пмр",
    ],
    services: ["PSN", "PS Store", "PS Plus", "PlayStation Turkey", "карты PlayStation"],
  },
  {
    slug: "telegram-premium-pmr",
    title: "Telegram Premium ПМР - купить премиум Telegram",
    description:
      "Telegram Premium в ПМР и Приднестровье: оформление подписки Telegram Premium, Telegram Stars и цифровых товаров Telegram через Ecliptic Store.",
    h1: "Telegram Premium ПМР",
    intro:
      "Страница для запросов про Telegram Premium, телеграм премиум, звезды Telegram и цифровые услуги Telegram в ПМР, Тирасполе и Приднестровье.",
    productSlug: "telegram-premium",
    phrases: [
      "telegram premium пмр",
      "телеграм премиум пмр",
      "купить telegram premium пмр",
      "телеграм премиум тирасполь",
      "telegram premium приднестровье",
      "премиум телеграм пмр",
    ],
    services: ["Telegram Premium", "Telegram Stars", "Telegram аккаунты", "цифровые товары Telegram"],
  },
  {
    slug: "pubg-mobile-donat-pmr",
    title: "PUBG Mobile донат ПМР - купить UC PUBG",
    description:
      "PUBG Mobile донат в ПМР: UC, пополнение PUBG Mobile и игровые товары через Ecliptic Store.",
    h1: "PUBG Mobile донат ПМР",
    intro:
      "Страница для тех, кто ищет PUBG Mobile, UC, пабг донат и пополнение PUBG в ПМР, Тирасполе и Приднестровье.",
    productSlug: "pubg-mobile",
    phrases: [
      "pubg mobile донат пмр",
      "пабг мобайл донат пмр",
      "купить uc пмр",
      "uc pubg пмр",
      "pubg mobile тирасполь",
      "пополнить pubg mobile пмр",
    ],
    services: ["PUBG Mobile", "UC PUBG", "пополнение PUBG", "игровой донат"],
  },
  {
    slug: "free-fire-donat-pmr",
    title: "Free Fire донат ПМР - алмазы Free Fire",
    description:
      "Free Fire донат в ПМР: алмазы Free Fire, игровые пополнения и цифровые товары через Ecliptic Store.",
    h1: "Free Fire донат ПМР",
    intro:
      "Страница под запросы Free Fire, фри фаер, алмазы Free Fire и донат Free Fire для покупателей из ПМР и Приднестровья.",
    productSlug: "free-fire",
    phrases: [
      "free fire донат пмр",
      "фри фаер донат пмр",
      "алмазы free fire пмр",
      "купить алмазы фри фаер",
      "free fire тирасполь",
      "пополнить free fire пмр",
    ],
    services: ["Free Fire", "алмазы Free Fire", "донат Free Fire", "игровые пополнения"],
  },
  {
    slug: "mobile-legends-donat-pmr",
    title: "Mobile Legends донат ПМР - алмазы MLBB",
    description:
      "Mobile Legends донат в ПМР: алмазы MLBB, пополнение Mobile Legends и игровые услуги через Ecliptic Store.",
    h1: "Mobile Legends донат ПМР",
    intro:
      "Страница для запросов Mobile Legends, MLBB, мобайл легендс, алмазы и игровые пополнения в ПМР.",
    productSlug: "mobile-legends",
    phrases: [
      "mobile legends донат пмр",
      "mlbb донат пмр",
      "мобайл легендс донат пмр",
      "алмазы mobile legends пмр",
      "купить алмазы mlbb",
      "mobile legends тирасполь",
    ],
    services: ["Mobile Legends", "MLBB", "алмазы Mobile Legends", "игровой донат"],
  },
  {
    slug: "discord-nitro-pmr",
    title: "Discord Nitro ПМР - купить Nitro",
    description:
      "Discord Nitro в ПМР и Приднестровье: оформление подписки Discord Nitro и цифровых подписок через Ecliptic Store.",
    h1: "Discord Nitro ПМР",
    intro:
      "Страница для покупателей, которые ищут Discord Nitro, дискорд нитро и цифровые подписки в ПМР, Тирасполе и Приднестровье.",
    productSlug: "discord-nitro",
    phrases: [
      "discord nitro пмр",
      "дискорд нитро пмр",
      "купить discord nitro пмр",
      "discord nitro тирасполь",
      "nitro приднестровье",
      "подписка discord пмр",
    ],
    services: ["Discord Nitro", "подписка Discord", "цифровые подписки", "онлайн услуги"],
  },
  {
    slug: "youtube-premium-pmr",
    title: "YouTube Premium ПМР - купить подписку",
    description:
      "YouTube Premium в ПМР: оформление подписки YouTube Premium и других цифровых подписок через Ecliptic Store.",
    h1: "YouTube Premium ПМР",
    intro:
      "Страница под запросы YouTube Premium, ютуб премиум и цифровые подписки для ПМР, Тирасполя и Приднестровья.",
    productSlug: "youtube-premium",
    phrases: [
      "youtube premium пмр",
      "ютуб премиум пмр",
      "купить youtube premium пмр",
      "youtube premium тирасполь",
      "подписка youtube пмр",
      "ютуб премиум приднестровье",
    ],
    services: ["YouTube Premium", "цифровые подписки", "онлайн подписки", "премиум сервисы"],
  },
  {
    slug: "tiktok-popolnenie-pmr",
    title: "TikTok пополнение ПМР - монеты TikTok",
    description:
      "TikTok пополнение в ПМР: монеты TikTok, цифровые товары TikTok и оформление заказа через Ecliptic Store.",
    h1: "TikTok пополнение ПМР",
    intro:
      "Страница для запросов TikTok, тик ток, монеты TikTok, пополнение TikTok и цифровые товары в ПМР.",
    productSlug: "tiktok",
    phrases: [
      "tiktok пополнение пмр",
      "тик ток пополнение пмр",
      "монеты tiktok пмр",
      "купить монеты тик ток",
      "tiktok тирасполь",
      "донат тик ток пмр",
    ],
    services: ["TikTok", "монеты TikTok", "пополнение TikTok", "цифровые товары"],
  },
  {
    slug: "chatgpt-plus-pmr",
    title: "ChatGPT Plus ПМР - купить подписку",
    description:
      "ChatGPT Plus в ПМР и Приднестровье: оформление подписки ChatGPT Plus и цифровых сервисов через Ecliptic Store.",
    h1: "ChatGPT Plus ПМР",
    intro:
      "Страница для запросов ChatGPT Plus, чат гпт плюс, подписка ChatGPT и цифровые сервисы в ПМР.",
    productSlug: "chatgpt-plus",
    phrases: [
      "chatgpt plus пмр",
      "чат гпт плюс пмр",
      "купить chatgpt plus пмр",
      "chatgpt plus тирасполь",
      "подписка chatgpt пмр",
      "openai пмр",
    ],
    services: ["ChatGPT Plus", "подписка ChatGPT", "цифровые сервисы", "онлайн подписки"],
  },
  {
    slug: "minecraft-pmr",
    title: "Minecraft ПМР - товары и пополнения Minecraft",
    description:
      "Minecraft в ПМР: игровые товары, пополнения, аккаунты и цифровые услуги Minecraft через Ecliptic Store.",
    h1: "Minecraft ПМР",
    intro:
      "Страница под запросы Minecraft, майнкрафт, игровые товары Minecraft и цифровые услуги для покупателей из ПМР.",
    productSlug: "minecraft",
    phrases: [
      "minecraft пмр",
      "майнкрафт пмр",
      "minecraft тирасполь",
      "купить minecraft пмр",
      "майнкрафт донат пмр",
      "minecraft приднестровье",
    ],
    services: ["Minecraft", "игровые товары Minecraft", "аккаунты", "цифровые товары"],
  },
  {
    slug: "gta-rp-donat-pmr",
    title: "GTA 5 RP донат ПМР - Majestic, Radmir, Amazing",
    description:
      "GTA 5 RP донат в ПМР: Majestic RP, Radmir RP, Amazing RP, Black Russia и другие игровые пополнения через Ecliptic Store.",
    h1: "GTA 5 RP донат ПМР",
    intro:
      "Страница для запросов GTA 5 RP, Majestic RP, Radmir RP, Amazing RP, Black Russia и RP-донат в ПМР.",
    productSlug: "gta-5-rp-majestic-rp",
    phrases: [
      "gta 5 rp донат пмр",
      "majestic rp пмр",
      "radmir rp пмр",
      "amazing rp пмр",
      "black russia донат пмр",
      "гта 5 рп донат пмр",
    ],
    services: ["GTA 5 RP", "Majestic RP", "Radmir RP", "Amazing RP", "Black Russia"],
  },
  {
    slug: "podpiski-pmr",
    title: "Подписки ПМР - Telegram, YouTube, Spotify, Discord, ChatGPT",
    description:
      "Цифровые подписки в ПМР: Telegram Premium, YouTube Premium, Spotify Premium, Discord Nitro, ChatGPT Plus и другие сервисы.",
    h1: "Цифровые подписки ПМР",
    intro:
      "Страница для запросов про покупку подписок в ПМР, Тирасполе и Приднестровье: Telegram, YouTube, Spotify, Discord, ChatGPT и другие сервисы.",
    phrases: [
      "подписки пмр",
      "купить подписку пмр",
      "цифровые подписки пмр",
      "подписка тирасполь",
      "онлайн подписки приднестровье",
      "премиум сервисы пмр",
    ],
    services: ["Telegram Premium", "YouTube Premium", "Spotify Premium", "Discord Nitro", "ChatGPT Plus"],
  },
];

function slugifyLanding(value: string) {
  const map: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "c",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ы: "y",
    э: "e",
    ю: "yu",
    я: "ya",
  };

  return value
    .toLowerCase()
    .split("")
    .map((char) => map[char] || char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function buildProductLandingPages() {
  const existingSlugs = new Set(manualSeoLandingPages.map((page) => page.slug));
  return products
    .map((product): SeoLandingPage => {
      const slug = `${slugifyLanding(product.name)}-pmr`;
      return {
        slug,
        title: `${product.name} ПМР - купить или пополнить через Ecliptic Store`,
        description: `${product.name} в ПМР: купить, оформить, пополнить или задонатить через Ecliptic Store.`,
        h1: `${product.name} ПМР`,
        intro: `Страница для запросов про ${product.name}, донат, пополнение и цифровые товары в ПМР, Тирасполе и Приднестровье.`,
        productSlug: product.slug,
        phrases: [
          `${product.name} пмр`,
          `${product.name} донат пмр`,
          `купить ${product.name} пмр`,
          `пополнить ${product.name} пмр`,
          `задонатить в ${product.name} пмр`,
          `пмр задонатить в ${product.name}`,
          `донат pmr ${product.name}`,
          `${product.name} donat pmr`,
          `${product.name} тирасполь`,
        ],
        services: [product.name, "донат ПМР", "пополнение ПМР", "цифровые товары"],
      };
    })
    .filter((page) => page.slug && !existingSlugs.has(page.slug));
}

export const seoLandingPages: SeoLandingPage[] = [
  ...manualSeoLandingPages,
  ...buildProductLandingPages(),
];

export function landingPageUrl(slug: string) {
  return `${LANDING_SITE_URL}/search/${slug}`;
}
