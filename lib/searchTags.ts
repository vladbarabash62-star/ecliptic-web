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
  "задонатить в",
  "донатить",
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
  "голда",
  "золото",
  "гемы",
  "робаксы",
  "робакси",
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
  "Стендофф 2",
  "Стаендофф 2",
  "станок 2",
  "станок 2",
  "голда стандофф 2",
  "голда standoff 2",
  "standoff 2 голда",
  "стандофф голда",
  "Roblox",
  "Роблокс",
  "робуксы",
  "робукси",
  "робаксы",
  "robux",
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

const supplementalSearchPhrases = [
  "эклиптик стор",
  "эклиптик store",
  "ecliptic store пмр",
  "ecliptic store тирасполь",
  "ecliptic store донат",
  "ecliptic сайт",
  "эклиптик сайт",
  "еклиптик стор",
  "эклиптикстор",
  "эклиптик сторе",
  "эклиптик сто",
  "эклиптик стоо",
  "элиптик стор",
  "екалиптик стор",
  "жэклиптик стор",
  "иклиптик стор",
  "эклиптик магазин",
  "эклиптик донат",
  "trkbgnbr cnjh",
  "trkbgnbr cnhj",
  "rkbgnbr cnjh",
  "rkbgnbr cnhj",
  "'rkbgNbr cnjh",
  "'rkbgNbr cnhj",
  "донат пмр",
  "донат приднестровье",
  "донат тирасполь",
  "задонатить пмр",
  "задонатить в пмр",
  "задонатить тирасполь",
  "пополнить игру пмр",
  "пополнить игры пмр",
  "игровой магазин пмр",
  "цифровой магазин пмр",
  "цифровые товары пмр",
  "купить донат пмр",
  "купить подписку пмр",
  "подписки пмр",
  "онлайн подписки пмр",
  "премиум подписки пмр",
  "steam пмр",
  "стим пмр",
  "пополнение стим пмр",
  "пополнить стим тирасполь",
  "steam пополнение приднестровье",
  "telegram premium пмр",
  "телеграм премиум пмр",
  "telegram stars пмр",
  "телеграм старс пмр",
  "звезды телеграм пмр",
  "standoff 2 пмр",
  "стандофф 2 пмр",
  "стендофф 2 пмр",
  "стандоф пмр",
  "стандофф голда пмр",
  "голда стандофф пмр",
  "купить голду стандофф пмр",
  "купить голду тирасполь",
  "робуксы пмр",
  "робаксы пмр",
  "robux пмр",
  "roblox донат пмр",
  "купить робуксы тирасполь",
  "brawl stars пмр",
  "бравл старс пмр",
  "браво старс пмр",
  "гемы бравл старс пмр",
  "brawl pass пмр",
  "pubg mobile пмр",
  "пабг мобайл пмр",
  "uc pubg пмр",
  "купить uc пмр",
  "free fire пмр",
  "фри фаер пмр",
  "алмазы free fire пмр",
  "mobile legends пмр",
  "mlbb пмр",
  "мобайл легендс пмр",
  "discord nitro пмр",
  "дискорд нитро пмр",
  "youtube premium пмр",
  "ютуб премиум пмр",
  "spotify premium пмр",
  "спотифай премиум пмр",
  "chatgpt plus пмр",
  "чат гпт плюс пмр",
  "tiktok монеты пмр",
  "тик ток монеты пмр",
  "playstation пмр",
  "psn пмр",
  "ps store пмр",
  "ps plus пмр",
  "minecraft пмр",
  "майнкрафт пмр",
  "gta 5 rp пмр",
  "majestic rp пмр",
  "radmir rp пмр",
  "amazing rp пмр",
  "black russia пмр",
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

export function buildSearchTags(limit = 3000) {
  const tags: string[] = [
    ...brandTerms,
    ...serviceAliases,
    ...regions,
    ...supplementalSearchPhrases,
    "донат пмр",
    "донат тирасполь",
    "донат приднестровье",
    "задонатить в пмр",
    "задонатить пмр",
    "заднатить в пмр",
    "игровой донат пмр",
    "игровой магазин тирасполь",
    "цифровые товары пмр",
    "купить подписку пмр",
    "купить интернет товар тирасполь",
    "купить голду пмр",
    "купить голду тирасполь",
    "голда стандофф 2 пмр",
    "голда стандофф приднестровье",
    "standoff 2 донат пмр",
    "задонатить в стандофф пмр",
    "робуксы пмр",
    "робуксы приднестровье",
    "robux пмр",
    "купить робуксы пмр",
    "роблокс донат пмр",
    "бравл старс донат пмр",
    "brawl stars донат пмр",
    "steam пополнение пмр",
    "пополнить стим пмр",
    "telegram stars пмр",
    "телеграм старс пмр",
    "psn пмр",
    "ps plus пмр",
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
