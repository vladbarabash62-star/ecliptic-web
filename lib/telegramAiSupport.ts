import { getProducts } from "./productStore";
import type { ProductOffer } from "./products";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

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

  const models = [...new Set([MODEL, "gemini-3.6-flash", "gemini-3.8-flash"])]
    .filter((model) => !model.includes("undefined"));
  for (const model of models) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 220 },
      }),
    }).catch((error) => {
      console.error("Gemini request failed", error instanceof Error ? error.message : "unknown error");
      return null;
    });
    if (!response?.ok) {
      console.error("Gemini model rejected request", model, response?.status || "no response");
      continue;
    }
    const payload = await response.json().catch(() => null);
    const text = payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("").trim();
    if (text && text.length <= 1200) return text;
  }
  return null;
}
