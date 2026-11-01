import { NextResponse } from "next/server";
import {
  getManagerChatId,
  rememberBusinessManagerChat,
  rememberManagerChat,
} from "../../../../lib/telegramManagerStore";
import { ensurePrimaryTelegramWebhook } from "../../../../lib/telegramWebhook";
import {
  getPendingTelegramOrder,
  claimPaymentNotification,
  releasePaymentNotificationClaim,
  savePendingTelegramOrder,
  type PendingTelegramOrder,
} from "../../../../lib/telegramPendingOrderStore";
import {
  getTelegramAccountNoticeTemplate,
  getTelegramCustomEmojiIds,
} from "../../../../lib/telegramCustomEmojiStore";
import { claimDailyGreeting, claimInactiveChatNotice, noteTelegramChatActivity, wasGreetingRecentlySent } from "../../../../lib/telegramDailyGreetingStore";
import { markTelegramChatOrder, noteTelegramCustomerMessage } from "../../../../lib/telegramChatHistoryStore";
import { getTelegramProductContext } from "../../../../lib/telegramProductContextStore";
import { compactProductCode } from "../../../../lib/orderCode";
import { getProducts } from "../../../../lib/productStore";
import type { Product } from "../../../../lib/products";
import { SITE_URL } from "../../../../lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TelegramMessage = {
  message_id?: number;
  chat?: { id?: number };
  from?: { id?: number; is_bot?: boolean; username?: string; first_name?: string; last_name?: string };
  sender_business_bot?: { id?: number; username?: string; first_name?: string };
  business_connection_id?: string;
  media_group_id?: string;
  text?: string;
  caption?: string;
  sticker?: { file_id: string; is_animated?: boolean; is_video?: boolean };
  photo?: Array<{ file_id: string; width?: number; height?: number }>;
  document?: { file_id: string; mime_type?: string; file_name?: string };
};

type TelegramUpdate = {
  message?: TelegramMessage;
  business_message?: TelegramMessage;
  business_connection?: { id?: string; user_chat_id?: number; is_enabled?: boolean };
  callback_query?: {
    id?: string;
    data?: string;
    from?: { id?: number; username?: string };
    message?: TelegramMessage & { message_id?: number };
  };
};

type TelegramBusinessConnection = {
  id?: string;
  user_chat_id?: number;
  can_reply?: boolean;
};

function token() {
  // All Telegram flows intentionally use one primary bot. Legacy payment-bot
  // tokens are excluded so an old webhook cannot silently create a second bot.
  return process.env.TELEGRAM_LOGIN_BOT_TOKEN
    || process.env.TELEGRAM_BOT_TOKEN
    || process.env.TELEGRAM_WEBAPP_BOT_TOKEN
    || "";
}

async function telegram(method: string, body: Record<string, unknown>) {
  const botToken = token();
  if (!botToken) return null;
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!response) {
    console.error("Telegram API request failed", method);
    return null;
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    console.error("Telegram API rejected request", method, response.status, payload?.description || "unknown error");
    return null;
  }
  return payload;
}

async function refreshBusinessConnection(connectionId: string) {
  const payload = await telegram("getBusinessConnection", {
    business_connection_id: connectionId,
  });
  return payload?.result as TelegramBusinessConnection | undefined;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function showTyping(chatId: number, businessConnectionId?: string) {
  await telegram("sendChatAction", {
    chat_id: chatId,
    ...(businessConnectionId ? { business_connection_id: businessConnectionId } : {}),
    action: "typing",
  });
  await sleep(1000);
}

function applyAccountNoticeEmojiIds(text: string, ids: string[]) {
  const emojiPlaceholders = ["❗", "⌛️", "🚫", "📄", "💡"];
  let result = text;
  let offset = 0;
  for (const [index, id] of ids.slice(0, emojiPlaceholders.length).entries()) {
    const emoji = emojiPlaceholders[index];
    const position = result.indexOf(emoji, offset);
    if (position < 0) continue;
    const tag = `<tg-emoji emoji-id="${escapeHtml(id)}">${emoji}</tg-emoji>`;
    result = `${result.slice(0, position)}${tag}${result.slice(position + emoji.length)}`;
    offset = position + tag.length;
  }
  return result;
}

function isOutgoingBusinessMessage(message: TelegramMessage) {
  // Telegram echoes messages sent by a connected business bot as business_message
  // updates. They must never be treated as a new customer order.
  return Boolean(message.sender_business_bot || message.from?.is_bot);
}

function extractOrderAmount(message: string) {
  const payment = message.match(/К оплате\s*:\s*([^\n]+)/i);
  if (payment?.[1]) return payment[1].trim();
  const fallback = message.match(/(?:оплате|Сумма)\s*:\s*([^\n]+)/i);
  return fallback?.[1]?.trim() || "уточняется";
}

function extractOrderField(message: string, field: string) {
  const match = message.match(new RegExp(`${field}\\s*:\\s*([^\\n]+)`, "i"));
  return match?.[1]?.trim() || "не указан";
}

function extractOrderCategory(message: string) {
  const service = extractOrderField(message, "Сервис");
  if (service !== "не указан") return { label: "Сервис", value: service };

  const platform = extractOrderField(message, "Платформа");
  if (platform !== "не указан") return { label: "Сервис", value: platform };

  const game = extractOrderField(message, "Игра");
  if (game !== "не указан") return { label: "Игра", value: game };

  return { label: "Сервис", value: "не указан" };
}

function extractOrderProduct(message: string) {
  const product = extractOrderField(message, "Товар");
  const category = extractOrderCategory(message);
  const region = extractOrderField(message, "Регион");
  if (product !== "не указан") {
    if (category.value.toLowerCase() === "telegram" && region !== "не указан") {
      return `Telegram ${product} ${region}`;
    }
    return product;
  }
  const service = category.value;
  const tariff = extractOrderField(message, "Тариф");
  const period = extractOrderField(message, "Период");
  if (tariff !== "не указан" && period !== "не указан") return `${tariff}, ${period}`;
  if (tariff !== "не указан") return tariff;
  const balance = message.match(/Сумма\s*:\s*([^\n]+)/i)?.[1]?.trim();
  if (balance && /steam/i.test(service)) return `Пополнение баланса ${balance}`;
  const amountLine = message.match(/(Количество золота|Количество монет|Сумма пополнения)\s*:\s*([^\n]+)/i);
  if (amountLine?.[2]) return `${amountLine[1]} ${amountLine[2].trim()}`;
  if (balance) return `Пополнение ${balance}`;
  return service !== "не указан" ? service : "Заказ";
}

function extractOrderCode(message: string) {
  return message.match(/\b(?:E-[A-Z0-9]{5}-(?:\d+|NA)-[A-Z0-9]{4}|ECL-[A-Z0-9]+(?:-[A-Z0-9]+){2,})\b/i)?.[0] || "";
}

function isGreetingText(message: string) {
  const value = message.trim().toLowerCase().replace(/ё/g, "е");
  return /^(привет(?:ствую)?|здравствуйте|здрасьте|добрый\s+(?:день|вечер|утро)|доброе\s+утро|ку|hello|hi)(?:\s|[!,.?]|$)/i.test(value);
}

function isPaymentDetailsRequest(message: string) {
  const value = normalizeSearchText(message);
  return /(?:куда|как)\s+(?:платить|кидать|переводить|оплачивать)|(?:скиньте|скинь|пришлите|пришли|дайте|дай|отправьте|отправь).{0,24}(?:реквизит|номер|оплат|перевод)|реквизит(?:ы)?/i.test(value);
}

function isQuietHours() {
  const hour = Number(new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Chisinau",
    hour: "2-digit",
    hourCycle: "h23",
    hour12: false,
  }).format(new Date()));
  return hour >= 0 && hour < 8;
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9]+/gi, " ").trim();
}

function normalizeProductQuery(value: string) {
  return normalizeSearchText(value)
    .replace(/(^|\s)(?:тг|tg)(?=\s|$)/g, "$1телеграм")
    .replace(/(^|\s)(?:акк|акки|аккаунты?)(?=\s|$)/g, "$1аккаунт")
    .replace(/(^|\s)прем(?=\s|$)/g, "$1премиум")
    .replace(/(^|\s)скоко(?=\s|$)/g, "$1сколько")
    .replace(/(^|\s)скока(?=\s|$)/g, "$1сколько")
    .replace(/(^|\s)скок(?=\s|$)/g, "$1сколько")
    .replace(/(^|\s)по\s*чем(?=\s|$)/g, "$1почем")
    .replace(/(^|\s)спотифай(?=\s|$)/g, "$1spotify")
    .replace(/(^|\s)спотик(?:а|е|у)?(?=\s|$)/g, "$1spotify")
    .replace(/(^|\s)премк(?:а|у|е)?(?=\s|$)/g, "$1премиум")
    .replace(/(^|\s)звезд(?:а|ы|е|у|ой|ами)?(?=\s|$)/g, "$1звезды")
    .replace(/\s+/g, " ")
    .trim();
}

const PRODUCT_REQUEST_ALIASES: Record<string, string[]> = {
  roblox: ["робукс", "робукса", "робуксов", "робуксы", "роблоксе", "robux"],
  steam: ["стим"],
  "telegram-stars": ["телеграм звезд", "телега звезд", "звезд", "звезды", "stars"],
  "telegram-premium": ["телеграм премиум", "телега премиум", "тг прем", "tg premium", "tg prem", "премк", "премиум", "premium"],
  "telegram-accounts": ["телеграм аккаунт", "телеграм аккаунты", "тг акк", "тг акки", "tg account", "tg acc"],
  "spotify-premium": ["спотифай", "спотик", "spotify", "споти"],
  "brawl-stars": ["brawl pass", "brawl pass plus", "бравл пасс", "бравл пас"],
};

function parseOrderCode(orderCode: string) {
  const compact = orderCode.match(/^E-([A-Z0-9]{5})-(\d+|NA)-([A-Z0-9]{4})$/i);
  if (compact) {
    return {
      alias: compact[1].toUpperCase(),
      priceRub: compact[2].toUpperCase() === "NA" ? undefined : Number(compact[2]),
    };
  }

  const legacy = orderCode.match(/^ECL-([A-Z0-9]+)-(?:(\d+)R|NA)-[A-Z0-9]+$/i);
  return legacy
    ? { legacyPrefix: legacy[1].toLowerCase(), priceRub: legacy[2] ? Number(legacy[2]) : undefined }
    : null;
}

type ResolvedOrderPayment = {
  amount: string;
  product?: Product;
  offerLabel?: string;
  sitePrice?: number;
  hasPayment: boolean;
  priceOnly?: boolean;
  quoteOnly?: boolean;
};

// Keep the reply policy explicit. Product offers can be edited in the admin,
// but these service-level decisions should not change just because an offer
// happens to be present or absent in storage.
const PAYMENT_DETAILS_SLUGS = new Set([
  "steam",
  "telegram-premium",
  "telegram-stars",
  "telegram-accounts",
  "sbp-payment",
  "site-topups",
  "spotify-premium",
  "standoff-2",
  "pubg-mobile",
  "brawl-stars",
  "roblox",
  "mobile-legends",
  "clash-of-clans",
  "clash-royale",
  "tiktok",
  "world-of-tanks",
  "free-fire",
  "grand-mobile",
  "black-russia",
  "radmir-rp",
  "amazing-rp",
  "fortnite",
  "youtube-premium",
  "delta-force",
  "cursor",
  "playstation",
]);

const MANAGER_CONTACT_SLUGS = new Set([
  "minecraft",
  "chatgpt-plus",
  "discord-nitro",
  "netflix",
  "epic-games-topup",
  "call-of-duty-mobile",
  "card-withdrawal-rf",
  "card-withdrawal-md",
  "nft",
  "busd",
  "twitch",
  "ton",
]);

const RU_RUBLE_TOPUP_SLUGS = new Set([
  "sbp-payment",
  "site-topups",
]);

function replyPolicy(product?: Product, hasPayment = false) {
  const slug = product?.slug.toLowerCase() || "";
  if (MANAGER_CONTACT_SLUGS.has(slug)) return "manager" as const;
  if (PAYMENT_DETAILS_SLUGS.has(slug)) return hasPayment ? "payment" as const : "manager" as const;
  return hasPayment ? "payment" as const : "manager" as const;
}

function ruRublesEquivalent(pricePmr?: number) {
  if (!Number.isFinite(pricePmr) || !pricePmr || pricePmr <= 0) return "";
  // The current rate is 30 PMR = 30 Russian rubles; round down to 5/0.
  const rubles = Math.floor(pricePmr / 5) * 5;
  return `${rubles} р РФ`;
}

async function resolveOrderPayment(orderMessage: string, orderCode: string): Promise<ResolvedOrderPayment> {
  const parsed = parseOrderCode(orderCode);
  if (!parsed) return { amount: "", hasPayment: false };

  const products = await getProducts({ cached: false }).catch(() => []);
  const product = products.find((candidate) => {
    if (parsed.alias) return compactProductCode(candidate.slug) === parsed.alias;
    return candidate.slug.toLowerCase().replace(/[^a-z0-9]/g, "").startsWith(parsed.legacyPrefix || "");
  });
  if (!product) {
    const amount = parsed.priceRub && parsed.priceRub > 0 ? `${parsed.priceRub} р ПМР` : "";
    return { amount, hasPayment: Boolean(amount) };
  }

  const offers = product.offers.filter((offer): offer is Extract<Product["offers"][number], { priceRub: number }> =>
    offer.type !== "divider" && typeof offer.priceRub === "number" && offer.priceRub > 0
  );
  const offer = offers.find((candidate) => candidate.priceRub === parsed.priceRub)
    || offers.find((candidate) => orderMessage.toLowerCase().includes(candidate.label.toLowerCase()))
    || (offers.length === 1 ? offers[0] : undefined);
  const orderPrice = parsed.priceRub && parsed.priceRub > 0 ? parsed.priceRub : offer?.priceRub;
  if (orderPrice) return {
    amount: `${orderPrice} р ПМР`,
    product,
    offerLabel: offer?.label,
    sitePrice: orderPrice,
    hasPayment: true,
  };

  return { amount: "", product, hasPayment: false };
}

function offerQuantity(label: string) {
  const quantity = label.match(/\d+(?:[.,]\d+)?/)?.[0];
  return quantity ? Number(quantity.replace(",", ".")) : 0;
}

function chooseBudgetBundle(
  offers: Array<Extract<Product["offers"][number], { priceRub: number }>>,
  budgetPmr: number
) {
  const limit = Math.floor(budgetPmr);
  if (limit <= 0) return undefined;

  type Bundle = { stars: number; cost: number; labels: string[] };
  const bestByCost: Array<Bundle | undefined> = Array.from({ length: limit + 1 });
  bestByCost[0] = { stars: 0, cost: 0, labels: [] };

  for (let cost = 0; cost <= limit; cost += 1) {
    const current = bestByCost[cost];
    if (!current) continue;
    for (const offer of offers) {
      const nextCost = cost + offer.priceRub;
      const quantity = offerQuantity(offer.label);
      if (nextCost > limit || quantity <= 0) continue;
      const candidate: Bundle = {
        stars: current.stars + quantity,
        cost: nextCost,
        labels: [...current.labels, offer.label],
      };
      const existing = bestByCost[nextCost];
      if (!existing || candidate.stars > existing.stars) bestByCost[nextCost] = candidate;
    }
  }

  const best = bestByCost.filter((bundle): bundle is Bundle => Boolean(bundle)).reduce<Bundle | undefined>(
    (currentBest, candidate) => {
      if (!currentBest || candidate.stars > currentBest.stars) return candidate;
      if (candidate.stars === currentBest.stars && candidate.cost > currentBest.cost) return candidate;
      return currentBest;
    },
    undefined
  );
  if (!best || best.labels.length === 0) return undefined;

  const labels = best.labels.reduce<string[]>((result, label) => {
    const index = result.findIndex((entry) => entry === label);
    if (index === -1) result.push(label);
    return result;
  }, []);
  const labelCounts = labels.map((label) => {
    const count = best.labels.filter((entry) => entry === label).length;
    return count > 1 ? `${label} x${count}` : label;
  });
  return { label: labelCounts.join(" + "), priceRub: best.cost };
}

async function resolveProductRequest(orderMessage: string): Promise<ResolvedOrderPayment> {
  const normalizedMessage = normalizeProductQuery(orderMessage);
  const isPriceQuestion = /(сколько\s+(?:стоит|стоят|это|будет|нужно|нужен|выходит)|сколько\s+.+?\s+сто(?:ит|ят)|какая\s+цена|стоимость|почем|цена|во\s+сколько)/i.test(normalizedMessage);
  const isAvailabilityQuestion = /(^|\s)(есть|имеется|наличие|можно)(?=\s|$)/i.test(normalizedMessage);
  const isStoreLinkRequest = /(купить|заказать|оформить|нужн|хочу|ссылк|скин|скид|магазин)/i.test(normalizedMessage)
    || isPriceQuestion
    || isAvailabilityQuestion;
  if (!/(купить|заказать|оформить|нужн|хочу|пополн|ссылк|скин|скид|магазин)/i.test(normalizedMessage) && !isPriceQuestion && !isAvailabilityQuestion) {
    return { amount: "", hasPayment: false };
  }

  const products = await getProducts({ cached: false }).catch(() => []);
  for (const product of products) {
    const aliases = [
      product.name,
      product.slug.replace(/[-_]+/g, " "),
      ...(PRODUCT_REQUEST_ALIASES[product.slug] || []),
    ].map(normalizeProductQuery).filter(Boolean);
    if (!aliases.some((alias) => normalizedMessage.includes(alias))) continue;

    const offers = product.offers.filter((offer): offer is Extract<Product["offers"][number], { priceRub: number }> =>
      offer.type !== "divider" && typeof offer.priceRub === "number" && offer.priceRub > 0
    );
    const budgetMatch = product.slug === "telegram-stars"
      ? normalizedMessage.match(/(?:на|за)\s+(\d+(?:[.,]\d+)?)\s*(?:р|руб|рубл(?:ь|я|ей))/i)
      : null;
    const budgetPmr = budgetMatch ? Number(budgetMatch[1].replace(",", ".")) : undefined;
    const messageQuantities = normalizedMessage.match(/\d+(?:[.,]\d+)?/g) || [];
    const hasOfferQualifier = messageQuantities.length > 0
      || /(месяц|месяч|год|индивидуал|семейн|регион|вход|логин|росси|украин|другой регион|pass|пасс)/i.test(normalizedMessage);
    const budgetBundle = budgetPmr && budgetPmr > 0
      ? chooseBudgetBundle(offers, budgetPmr)
      : undefined;
    const textualOffer = [...offers]
      .sort((left, right) => normalizeProductQuery(right.label).length - normalizeProductQuery(left.label).length)
      .find((candidate) => normalizedMessage.includes(normalizeProductQuery(candidate.label)));
    const offer = budgetBundle ? undefined : textualOffer || offers.find((candidate) => {
      const quantityTokens = candidate.label.match(/\d+(?:[.,]\d+)?/g) || [];
      return quantityTokens.some((token) => messageQuantities.some(
        (messageQuantity) => Number(messageQuantity.replace(",", ".")) === Number(token.replace(",", "."))
      ));
    })
      || (hasOfferQualifier && offers.length === 1 ? offers[0] : undefined);
    if (!budgetBundle && !offer) {
      return isStoreLinkRequest
        ? { amount: "", product, hasPayment: false, priceOnly: true }
        : { amount: "", product, hasPayment: false };
    }

    const dollarMatch = orderMessage.match(/(\d+(?:[.,]\d+)?)\s*(?:\$|доллар(?:а|ов)?)/i);
    const steamDollarAmount = product.slug === "steam" && dollarMatch
      ? Number(dollarMatch[1].replace(",", "."))
      : undefined;
    const paymentPrice = steamDollarAmount && steamDollarAmount > 0
      ? Math.round(steamDollarAmount * 21)
      : budgetBundle?.priceRub || offer?.priceRub;
    const offerLabel = budgetBundle?.label || offer?.label;

    return {
      amount: `${paymentPrice} р ПМР`,
      product,
      offerLabel,
      sitePrice: paymentPrice,
      hasPayment: true,
      priceOnly: isPriceQuestion,
      quoteOnly: isPriceQuestion && hasOfferQualifier,
    };
  }

  return { amount: "", hasPayment: false };
}

async function sendPriceAnswer(
  chatId: number,
  payment: ResolvedOrderPayment,
  businessConnectionId?: string
) {
  if (!payment.product) return false;
  const productUrl = `${SITE_URL}/products/${encodeURIComponent(payment.product.slug)}`;
  const linkLabel = payment.product.slug === "telegram-stars"
    ? "Купить звёзды"
    : `Купить ${payment.product.name}`;
  const text = payment.priceOnly && !payment.quoteOnly
    ? `<b><a href="${productUrl}">${escapeHtml(linkLabel)}</a></b>`
    : payment.offerLabel && payment.amount
      ? `<b>${escapeHtml(payment.product.name)}</b>\n<b>${escapeHtml(payment.offerLabel)}</b>\n\n<b>Стоимость: ${escapeHtml(payment.amount)}</b>\n\n<b><a href="${productUrl}">${escapeHtml(linkLabel)}</a></b>`
      : "";
  if (!text) return false;
  const response = await telegram("sendMessage", {
    chat_id: chatId,
    ...(businessConnectionId ? { business_connection_id: businessConnectionId } : {}),
    parse_mode: "HTML",
    disable_web_page_preview: true,
    text,
  });
  return Boolean(response);
}

async function sendOrderInstructions(
  chatId: number,
  orderMessage: string,
  businessConnectionId?: string,
  paymentAmount?: string,
  hasPayment = false,
  productData?: Product,
  sitePrice?: number,
  offerLabel?: string,
  suppressWelcome = false
) {
  const category = extractOrderCategory(orderMessage);
  const product = extractOrderProduct(orderMessage);
  const displayCategory = category.value === "не указан" ? productData?.name || category.value : category.value;
  const displayProduct = product === "Заказ" ? offerLabel || productData?.name || product : product;
  const policy = replyPolicy(productData, hasPayment);
  const isTelegramAccount = displayCategory.trim().toLowerCase() === "telegram" && /аккаунт/i.test(displayProduct);
  const fallbackAccountSafetyNotice = isTelegramAccount
    ? applyAccountNoticeEmojiIds([
        "",
        "❗ Важно! Ознакомьтесь перед использованием аккаунта",
        "",
        "После передачи аккаунта ответственность за его дальнейшее использование несёте только вы.",
        "",
        "Рекомендуем для безопасного использования:",
        "• ⏳ Не пользоваться аккаунтом первые 48 часов.",
        "• 🚫 Не спамить и не флудить другим пользователям.",
        "• 📄 Соблюдать правила Telegram.",
        "",
        "🤝 Следуя этим простым рекомендациям, вы снизите вероятность возникновения каких-либо ограничений.",
      ].join("\n"), (await getTelegramCustomEmojiIds())?.ids || [])
    : "";
  const welcomeText = "<b>Здравствуйте,</b>\n\n<b>Добро пожаловать в Ecliptic Store!</b>";
  if (policy === "manager") {
    const response = await telegram("sendMessage", {
      chat_id: chatId,
      ...(businessConnectionId ? { business_connection_id: businessConnectionId } : {}),
      parse_mode: "HTML",
      text: suppressWelcome
        ? "<b>В ближайшее время с вами свяжется менеджер.</b>"
        : `${welcomeText}\n\n<b>В ближайшее время с вами свяжется менеджер.</b>`,
    });
    return Boolean(response);
  }
  const paymentLines = [
    `<b>${category.label}: ${escapeHtml(displayCategory)}</b>`,
    `<b>Товар: ${escapeHtml(displayProduct)}</b>`,
    "",
    "<b>Реквизиты для оплаты переводилкой:</b>",
    "",
    "<b>Номер получателя: <code>77534682</code></b>",
    "<b>Получатель: Владислав Б</b>",
    `<b>Сумма к оплате: ${escapeHtml(paymentAmount || extractOrderAmount(orderMessage))}</b>`,
  ];
  const ruRubles = RU_RUBLE_TOPUP_SLUGS.has(productData?.slug.toLowerCase() || "")
    ? ruRublesEquivalent(sitePrice)
    : "";
  if (ruRubles) {
    paymentLines.push(
      "",
      "<b>Курс: 30 р ПМР = 30 р РФ.</b>",
      `<b>Баланс будет пополнен на ${escapeHtml(ruRubles)}.</b>`,
    );
  }
  if (productData?.slug.toLowerCase() === "world-of-tanks") {
    paymentLines.push("", "<b>После оплаты отправьте данные вашего аккаунта: логин и пароль.</b>");
  } else {
    paymentLines.push("", "<b>После оплаты отправьте сюда скриншот операции.</b>");
  }
  const paymentText = paymentLines.join("\n");
  if (suppressWelcome) {
    const response = await telegram("sendMessage", {
      chat_id: chatId,
      ...(businessConnectionId ? { business_connection_id: businessConnectionId } : {}),
      parse_mode: "HTML",
      text: paymentText,
    });
    if (!response || !isTelegramAccount) return Boolean(response);
    const customTemplate = await getTelegramAccountNoticeTemplate();
    const notice = customTemplate || { text: fallbackAccountSafetyNotice, entities: [] };
    const noticeResponse = await telegram("sendMessage", {
      chat_id: chatId,
      ...(businessConnectionId ? { business_connection_id: businessConnectionId } : {}),
      text: notice.text,
      ...(notice.entities.length ? { entities: notice.entities } : { parse_mode: "HTML" }),
    });
    return Boolean(noticeResponse);
  }
  await showTyping(chatId, businessConnectionId);
  await telegram("sendMessage", {
    chat_id: chatId,
    ...(businessConnectionId ? { business_connection_id: businessConnectionId } : {}),
    parse_mode: "HTML",
    text: welcomeText,
  });

  // The payment details follow immediately after the short greeting delay.
  const response = await telegram("sendMessage", {
    chat_id: chatId,
    ...(businessConnectionId ? { business_connection_id: businessConnectionId } : {}),
    parse_mode: "HTML",
    text: paymentText,
  });
  if (!response || !isTelegramAccount) return Boolean(response);
  const customTemplate = await getTelegramAccountNoticeTemplate();
  const notice = customTemplate || { text: fallbackAccountSafetyNotice, entities: [] };
  const noticeResponse = await telegram("sendMessage", {
    chat_id: chatId,
    ...(businessConnectionId ? { business_connection_id: businessConnectionId } : {}),
    text: notice.text,
    ...(notice.entities.length ? { entities: notice.entities } : { parse_mode: "HTML" }),
  });
  return Boolean(noticeResponse);
}

async function sendDailyGreeting(chatId: number, businessConnectionId?: string) {
  const text = "Здравствуйте, добро пожаловать в Ecliptic Store. Напишите, какой товар или услугу вы хотите оформить.";
  await showTyping(chatId, businessConnectionId);
  const response = await telegram("sendMessage", {
    chat_id: chatId,
    ...(businessConnectionId ? { business_connection_id: businessConnectionId } : {}),
    text,
  });
  return Boolean(response);
}

async function sendQuietHoursNotice(chatId: number, businessConnectionId?: string) {
  const text = "Здравствуйте! Сейчас нерабочее время. Рабочее время — с 08:00 до 00:00. Я могу не ответить сразу, потому что отдыхаю. Напишите свой вопрос или заказ — отвечу в рабочее время. Спасибо за понимание!";
  const response = await telegram("sendMessage", {
    chat_id: chatId,
    ...(businessConnectionId ? { business_connection_id: businessConnectionId } : {}),
    text,
  });
  return Boolean(response);
}

type PaymentAttachment = { kind: "photo" | "document"; fileId: string };

const paymentBatches = new Map<string, PaymentAttachment[]>();
const paymentBatchJobs = new Map<string, Promise<boolean>>();

async function notifyManagerAboutPayment(
  message: TelegramMessage,
  pending: PendingTelegramOrder,
  attachments: PaymentAttachment[] = []
) {
  const managerChatId = await getManagerChatId();
  const customerChatId = Number(message.chat?.id);
  if (!managerChatId || !Number.isFinite(customerChatId)) return false;

  const sender = [message.from?.first_name, message.from?.last_name].filter(Boolean).join(" ") || "не указано";
  const username = message.from?.username ? `@${message.from.username}` : "не указан";
  const category = extractOrderCategory(pending.orderMessage);
  const managerText = [
    "💳 <b>Клиент отправил скриншот оплаты</b>",
    "",
    `Клиент: <b>${escapeHtml(sender)}</b>`,
    `Telegram: <b>${escapeHtml(username)}</b>`,
    `Chat ID: <code>${customerChatId}</code>`,
    `${category.label}: <b>${escapeHtml(category.value)}</b>`,
    `Товар: <b>${escapeHtml(extractOrderProduct(pending.orderMessage))}</b>`,
    `Сумма: <b>${escapeHtml(pending.amount)}</b>`,
  ].join("\n");
  const callbackBase = [String(customerChatId), pending.businessConnectionId || ""].filter(Boolean).join(":");
  const replyMarkup = {
    inline_keyboard: [[
      { text: "✅ Подтвердить оплату", callback_data: `pay:approve:${callbackBase}` },
      { text: "❌ Отклонить", callback_data: `pay:reject:${callbackBase}` },
    ]],
  };

  const attachmentKind = attachments[0]?.kind;
  if (attachments.length > 1 && attachmentKind && attachments.every((item) => item.kind === attachmentKind)) {
    const media = attachments.slice(0, 10).map((item, index) => ({
      type: attachmentKind,
      media: item.fileId,
      ...(index === 0 ? { caption: managerText, parse_mode: "HTML" } : {}),
    }));
    const album = await telegram("sendMediaGroup", {
      chat_id: managerChatId,
      media,
    });
    const firstMessageId = album?.result?.[0]?.message_id;
    if (!firstMessageId) return false;
    const edited = await telegram("editMessageReplyMarkup", {
      chat_id: managerChatId,
      message_id: firstMessageId,
      reply_markup: replyMarkup,
    });
    return Boolean(edited);
  }

  if (message.photo?.length) {
    const largest = message.photo[message.photo.length - 1];
    return Boolean(await telegram("sendPhoto", {
      chat_id: managerChatId,
      photo: largest.file_id,
      caption: managerText,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    }));
  }

  if (message.document?.file_id) {
    return Boolean(await telegram("sendDocument", {
      chat_id: managerChatId,
      document: message.document.file_id,
      caption: managerText,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    }));
  }

  return false;
}

async function queuePaymentScreenshot(message: TelegramMessage, pending: PendingTelegramOrder) {
  const customerChatId = String(message.chat?.id || "");
  const key = `${customerChatId}:${pending.orderCode}`;
  const attachments = paymentBatches.get(key) || [];
  const nextAttachment = message.photo?.length
    ? { kind: "photo" as const, fileId: message.photo[message.photo.length - 1].file_id }
    : message.document?.file_id
      ? { kind: "document" as const, fileId: message.document.file_id }
      : null;
  if (!nextAttachment) return false;
  if (!attachments.some((item) => item.fileId === nextAttachment.fileId)) attachments.push(nextAttachment);
  paymentBatches.set(key, attachments);

  const existingJob = paymentBatchJobs.get(key);
  if (existingJob) return existingJob;

  const job = (async () => {
    // Telegram sends album items almost together. Keep only a short window for
    // collecting them while letting a normal single screenshot notify the manager immediately.
    await sleep(message.media_group_id ? 350 : 0);
    const batch = paymentBatches.get(key) || [];
    paymentBatches.delete(key);
    const claimed = await claimPaymentNotification(Number(customerChatId));
    if (!claimed) return false;
    const notified = await notifyManagerAboutPayment(message, pending, batch);
    if (!notified) await releasePaymentNotificationClaim(Number(customerChatId));
    return notified;
  })();
  paymentBatchJobs.set(key, job);
  try {
    return await job;
  } finally {
    paymentBatchJobs.delete(key);
  }
}

async function handleDecision(update: TelegramUpdate) {
  const callback = update.callback_query;
  const data = callback?.data || "";
  const managerChatId = await getManagerChatId();
  const callbackChatId = String(callback?.message?.chat?.id || "");
  if (!callback || callbackChatId !== String(managerChatId)) return false;

  const match = data.match(/^pay:(approve|reject):(-?\d+)(?::([A-Za-z0-9_-]+))?$/);
  if (!match) return false;
  const [, decision, customerChatId, businessConnectionId] = match;
  const approved = decision === "approve";
  await telegram("answerCallbackQuery", {
    callback_query_id: callback.id,
    text: approved ? "Оплата подтверждена" : "Оплата отклонена",
    show_alert: false,
  });
  await telegram("editMessageReplyMarkup", {
    chat_id: callbackChatId,
    message_id: callback.message?.message_id,
    reply_markup: { inline_keyboard: [] },
  });
  await telegram("sendMessage", {
    chat_id: customerChatId,
    ...(businessConnectionId ? { business_connection_id: businessConnectionId } : {}),
    text: approved
      ? "✅ Оплата принята. Заказ передан в работу."
      : "❌ Не удалось подтвердить оплату. Проверьте сумму и отправьте актуальный скриншот операции.",
  });
  if (!approved) await releasePaymentNotificationClaim(Number(customerChatId));
  return true;
}

export async function processTelegramPaymentUpdate(update: TelegramUpdate, request?: Request) {
  const botToken = token();
  if (!botToken) return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN is not configured" }, { status: 500 });
  if (request) await ensurePrimaryTelegramWebhook(request, botToken);
  if (update.business_connection?.is_enabled && update.business_connection.user_chat_id) {
    await rememberBusinessManagerChat(update.business_connection.user_chat_id).catch(() => undefined);
  }
  if (await handleDecision(update)) return NextResponse.json({ ok: true, decision: true });

  const message = update.business_message || update.message;
  if (!message?.chat?.id) return NextResponse.json({ ok: true, ignored: true });
  if (!message.business_connection_id && !update.business_message) {
    return NextResponse.json({ ok: true, ignored: "orders-bot-manager-only" });
  }
  if (isOutgoingBusinessMessage(message)) {
    await noteTelegramChatActivity(message.chat.id).catch(() => undefined);
    return NextResponse.json({ ok: true, ignored: "outgoing" });
  }
  const businessConnection = message.business_connection_id
    ? await refreshBusinessConnection(message.business_connection_id).catch(() => undefined)
    : undefined;
  if (businessConnection?.user_chat_id) {
    await rememberBusinessManagerChat(businessConnection.user_chat_id).catch(() => undefined);
    // A manual message from the connected business account is not a customer
    // message and must never trigger an automatic reply.
    if (message.from?.id === businessConnection.user_chat_id) {
      await noteTelegramChatActivity(message.chat.id).catch(() => undefined);
      return NextResponse.json({ ok: true, ignored: "manager-message" });
    }
  }
  const chatHistory = await noteTelegramCustomerMessage(message.chat.id, message.message_id).catch(() => ({
    messageCount: 0,
    established: false,
  }));
  await rememberManagerChat(message.from?.username, message.chat.id).catch(() => undefined);
  if (message.text?.trim() && !message.photo?.length && !message.document?.file_id) {
    const orderCode = extractOrderCode(message.text);
    const resolvedPayment = orderCode
      ? await resolveOrderPayment(message.text, orderCode)
      : await resolveProductRequest(message.text);
    if (!orderCode && isPaymentDetailsRequest(message.text)) {
      const context = await getTelegramProductContext(message.chat.id).catch(() => null);
      if (context) {
        const products = await getProducts({ cached: false }).catch(() => []);
        const product = products.find((candidate) => candidate.slug === context.productSlug);
        if (product) {
          const contextPayment: ResolvedOrderPayment = {
            amount: context.amount,
            product,
            offerLabel: context.offerLabel,
            sitePrice: context.sitePrice,
            hasPayment: true,
          };
          const replied = await sendOrderInstructions(
            message.chat.id,
            context.sourceMessage,
            message.business_connection_id,
            contextPayment.amount,
            chatHistory.established,
            contextPayment.product,
            contextPayment.sitePrice,
            contextPayment.offerLabel,
            await wasGreetingRecentlySent(message.chat.id).catch(() => false)
          );
          if (replied && chatHistory.established) {
            await savePendingTelegramOrder({
              chatId: message.chat.id,
              businessConnectionId: message.business_connection_id,
              orderCode: `TEXT-${message.message_id || Date.now()}`,
              amount: contextPayment.amount,
              orderMessage: context.sourceMessage,
              createdAt: new Date().toISOString(),
            });
          }
          await noteTelegramChatActivity(message.chat.id).catch(() => undefined);
          return NextResponse.json({ ok: true, replied, awaitingPayment: replied, paymentDetails: true });
        }
      }
    }
    if (!orderCode && resolvedPayment.priceOnly) {
      // A concrete offer is enough to provide payment details. Do not gate
      // this on chat history: a first-time customer can place a precise order.
      const shouldSendPaymentDetails = Boolean(resolvedPayment.quoteOnly && resolvedPayment.hasPayment);
      const replied = shouldSendPaymentDetails
        ? await sendOrderInstructions(
            message.chat.id,
            message.text,
            message.business_connection_id,
            resolvedPayment.amount,
            true,
            resolvedPayment.product,
            resolvedPayment.sitePrice,
            resolvedPayment.offerLabel,
            await wasGreetingRecentlySent(message.chat.id).catch(() => false)
          )
        : await sendPriceAnswer(message.chat.id, resolvedPayment, message.business_connection_id);
      if (replied && shouldSendPaymentDetails) {
        await savePendingTelegramOrder({
          chatId: message.chat.id,
          businessConnectionId: message.business_connection_id,
          orderCode: `TEXT-${message.message_id || Date.now()}`,
          amount: resolvedPayment.amount,
          orderMessage: message.text,
          createdAt: new Date().toISOString(),
        });
        await markTelegramChatOrder(message.chat.id).catch(() => undefined);
      }
      await noteTelegramChatActivity(message.chat.id).catch(() => undefined);
      return NextResponse.json({ ok: true, replied, priceAnswer: replied });
    }
    if (!orderCode && !resolvedPayment.hasPayment) {
      const shouldSendQuietHoursNotice = isQuietHours()
        ? await claimInactiveChatNotice(message.chat.id).catch(() => false)
        : false;
      const shouldGreet = !shouldSendQuietHoursNotice && isGreetingText(message.text)
        ? await claimDailyGreeting(message.chat.id).catch(() => false)
        : false;
      const replied = shouldSendQuietHoursNotice
        ? await sendQuietHoursNotice(message.chat.id, message.business_connection_id)
        : shouldGreet
          ? await sendDailyGreeting(message.chat.id, message.business_connection_id)
        : false;
      await noteTelegramChatActivity(message.chat.id).catch(() => undefined);
      return NextResponse.json({ ok: true, replied, ignored: "not-an-order" });
    }
    const replied = await sendOrderInstructions(
      message.chat.id,
      message.text,
      message.business_connection_id,
      resolvedPayment.amount,
      resolvedPayment.hasPayment,
      resolvedPayment.product,
      resolvedPayment.sitePrice,
      resolvedPayment.offerLabel,
      await wasGreetingRecentlySent(message.chat.id).catch(() => false)
    );
    if (replied && resolvedPayment.hasPayment) {
      await savePendingTelegramOrder({
        chatId: message.chat.id,
        businessConnectionId: message.business_connection_id,
        orderCode: orderCode || `TEXT-${message.message_id || Date.now()}`,
        amount: resolvedPayment.amount,
        orderMessage: message.text,
        createdAt: new Date().toISOString(),
      });
      await markTelegramChatOrder(message.chat.id).catch(() => undefined);
    }
    await noteTelegramChatActivity(message.chat.id).catch(() => undefined);
    return NextResponse.json({ ok: true, replied, awaitingPayment: replied });
  }

  if (message.photo?.length || message.document?.file_id) {
    const pending = await getPendingTelegramOrder(message.chat.id);
    if (!pending) return NextResponse.json({ ok: true, ignored: "no-pending-order" });
    const notified = await queuePaymentScreenshot(message, pending);
    await noteTelegramChatActivity(message.chat.id).catch(() => undefined);
    return NextResponse.json({ ok: true, paymentScreenshot: true, notified });
  }

  if (message.sticker) {
    const shouldSendQuietHoursNotice = isQuietHours()
      ? await claimInactiveChatNotice(message.chat.id).catch(() => false)
      : false;
    const shouldGreet = !shouldSendQuietHoursNotice
      ? await claimDailyGreeting(message.chat.id).catch(() => false)
      : false;
    const replied = shouldSendQuietHoursNotice
      ? await sendQuietHoursNotice(message.chat.id, message.business_connection_id)
      : shouldGreet
        ? await sendDailyGreeting(message.chat.id, message.business_connection_id)
      : false;
    await noteTelegramChatActivity(message.chat.id).catch(() => undefined);
    return NextResponse.json({ ok: true, replied, ignored: "sticker" });
  }

  return NextResponse.json({ ok: true, ignored: "not-an-order" });
}

export async function POST(request: Request) {
  const expectedSecret = process.env.PAYMENT_TELEGRAM_WEBHOOK_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET || "";
  if (expectedSecret && request.headers.get("x-telegram-bot-api-secret-token") !== expectedSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const update = await request.json().catch(() => ({})) as TelegramUpdate;
  return processTelegramPaymentUpdate(update, request);
}
