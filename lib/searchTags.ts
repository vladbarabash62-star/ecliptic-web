import { products } from "./products";

const brandTerms = [
  "Ecliptic Store",
  "Ecliptic",
  "ecliptic.website",
  "эклиптик стор",
  "эклиптик магазин",
  "эклиптик донат",
  "экалиптик стор",
  "еклиптик стор",
  "эклиптик сто",
  "эклиптик стоо",
  "эклиптик тсор",
  "эклиптик сторе",
  "эклиптек стор",
  "эклиптки стор",
  "эклиптикстор",
  "жэклиптик стор",
  "иклиптик стор",
  "ecliptic stor",
  "ecliptic stroe",
  "ecliptik store",
  "eclipticstore",
  "trkbgnbr cnjh",
  "trkbgnbr cnhj",
  "'rkbgNbr cnjh",
  "'rkbgNbr cnhj",
];

const regions = [
  "ПМР",
  "Приднестровье",
  "Тирасполь",
  "Бендеры",
  "Рыбница",
  "Дубоссары",
  "Слободзея",
  "Григориополь",
  "Каменка",
  "Днестровск",
  "Молдова",
  "онлайн",
];

const actions = [
  "донат",
  "задонатить",
  "заднатить",
  "пополнить",
  "пополнение",
  "купить",
  "заказать",
  "оформить",
  "оплатить",
  "цена",
  "дешево",
  "быстро",
  "магазин",
  "цифровые товары",
  "игровые товары",
  "подписка",
  "премиум",
  "аккаунт",
  "голда",
  "гемы",
  "алмазы",
  "robux",
  "робуксы",
  "uc",
  "coins",
  "звезды",
];

const serviceAliases = [
  "Steam",
  "Стим",
  "пополнение Steam",
  "Telegram Premium",
  "Telegram Stars",
  "телеграм премиум",
  "телеграм старс",
  "Brawl Stars",
  "Бравл Старс",
  "браво старс",
  "бравл старс донат",
  "Standoff 2",
  "Стандофф 2",
  "станок 2",
  "голда стандофф 2",
  "Roblox",
  "Роблокс",
  "робуксы",
  "PUBG Mobile",
  "Пабг мобайл",
  "Free Fire",
  "Фри Фаер",
  "Mobile Legends",
  "Мобайл Легендс",
  "Clash of Clans",
  "Клеш оф Кленс",
  "Clash Royale",
  "Клеш Рояль",
  "Minecraft",
  "Майнкрафт",
  "TikTok",
  "Тик Ток",
  "PlayStation",
  "PS Store",
  "PS Plus",
  "Spotify Premium",
  "YouTube Premium",
  "Discord Nitro",
  "ChatGPT Plus",
  "World of Tanks",
  "Мир танков",
  "GTA 5 RP",
  "Majestic RP",
  "Radmir RP",
  "Amazing RP",
  "Black Russia",
  "Oxide",
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

export function buildSearchTags(limit = 1800) {
  const tags: string[] = [
    ...brandTerms,
    ...serviceAliases,
    ...regions,
    "донат пмр",
    "донат тирасполь",
    "задонатить в пмр",
    "игровой донат пмр",
    "игровой магазин тирасполь",
    "цифровые товары пмр",
    "купить подписку пмр",
    "купить интернет товар тирасполь",
  ];

  for (const brand of brandTerms) {
    for (const region of regions) {
      tags.push(`${brand} ${region}`);
      tags.push(`${brand} донат ${region}`);
      tags.push(`${brand} магазин ${region}`);
    }
  }

  for (const service of serviceAliases) {
    tags.push(`${service} Ecliptic Store`);
    tags.push(`${service} эклиптик стор`);

    for (const region of regions) {
      tags.push(`${service} ${region}`);
      tags.push(`${service} донат ${region}`);
      tags.push(`${service} пополнение ${region}`);
      tags.push(`${service} купить ${region}`);
      tags.push(`${service} цена ${region}`);
    }

    for (const action of actions) {
      tags.push(`${action} ${service}`);
      tags.push(`${action} ${service} ПМР`);
      tags.push(`${action} ${service} Тирасполь`);
      tags.push(`${action} ${service} Приднестровье`);
    }
  }

  for (const product of products) {
    const offers = product.offers.filter((offer) => offer.type !== "divider");
    for (const offer of offers) {
      tags.push(`${product.name} ${offer.label}`);
      tags.push(`${product.name} ${offer.label} ПМР`);
      tags.push(`${product.name} ${offer.label} Тирасполь`);
      tags.push(`купить ${product.name} ${offer.label}`);
      tags.push(`донат ${product.name} ${offer.label}`);
    }
  }

  return unique(tags).slice(0, limit);
}
