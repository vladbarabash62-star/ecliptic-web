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

export const seoLandingPages: SeoLandingPage[] = [
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
      "задонатить в пмр",
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
];

export function landingPageUrl(slug: string) {
  return `${LANDING_SITE_URL}/search/${slug}`;
}
