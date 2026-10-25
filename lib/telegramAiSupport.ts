import { getProducts } from "./productStore";
import type { ProductOffer } from "./products";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function apiKey() {
  return process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || process.env.GOOGLE_API_KEY || "";
}

function catalogContext(products: Awaited<ReturnType<typeof getProducts>>) {
  return products.map((product) => {
    const offers = product.offers
      .filter((offer): offer is ProductOffer => offer.type !== "divider")
      .slice(0, 30)
      .map((offer) => `${offer.label} — ${offer.priceRub} р.`)
      .join(", ");
    return `${product.name}: ${offers || "варианты уточняются"}`;
  }).join("\n").slice(0, 18000);
}

export async function generateTelegramSupportReply(question: string) {
  const key = apiKey();
  if (!key || !question.trim()) return null;

  const products = await getProducts({ cached: false }).catch(() => []);
  const prompt = [
    "Ты безопасный консультант магазина Ecliptic Store.",
    "Отвечай кратко и вежливо на русском языке.",
    "Используй только каталог ниже. Не придумывай цены, реквизиты, наличие, сроки или факт оплаты.",
    "Если вопрос про оплату, скриншот, возврат, аккаунт, пароль, спорную ситуацию или данных не хватает — напиши, что менеджер уточнит вопрос лично.",
    "Не оформляй заказ и не подтверждай оплату от имени магазина.",
    "Каталог:",
    catalogContext(products),
    "Вопрос клиента:",
    question.trim().slice(0, 1000),
  ].join("\n\n");

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 220 },
    }),
  }).catch(() => null);
  if (!response?.ok) return null;
  const payload = await response.json().catch(() => null);
  const text = payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("").trim();
  if (!text || text.length > 1200) return null;
  return text;
}
