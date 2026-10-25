import { getProducts } from "./productStore";
import type { ProductOffer } from "./products";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const REQUEST_TIMEOUT_MS = 4500;
const MODEL_DISCOVERY_TIMEOUT_MS = 1800;

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

async function availableModels(key: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MODEL_DISCOVERY_TIMEOUT_MS);
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`, {
    signal: controller.signal,
    cache: "no-store",
  }).catch(() => null).finally(() => clearTimeout(timeout));
  if (!response?.ok) return [];
  const payload = await response.json().catch(() => null);
  return Array.isArray(payload?.models)
    ? payload.models
        .filter((model: { name?: unknown; supportedGenerationMethods?: unknown }) =>
          typeof model.name === "string" &&
          Array.isArray(model.supportedGenerationMethods) &&
          model.supportedGenerationMethods.includes("generateContent") &&
          /flash/i.test(model.name))
        .map((model: { name: string }) => model.name.replace(/^models\//, ""))
    : [];
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

  const discoveredModels = await availableModels(key);
  const models = [...new Set([MODEL, ...discoveredModels, "gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.8-flash"])]
    .filter((model) => !model.includes("undefined"));
  const deadline = Date.now() + 5000;
  for (const model of models) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.min(REQUEST_TIMEOUT_MS, remaining));
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 220 },
      }),
    }).catch((error) => {
      console.error("Gemini request failed", error instanceof Error ? error.message : "unknown error");
      return null;
    }).finally(() => clearTimeout(timeout));
    if (!response?.ok) {
      const detail = response ? await response.text().catch(() => "") : "";
      console.error("Gemini model rejected request", model, response?.status || "no response", detail.slice(0, 240));
      continue;
    }
    const payload = await response.json().catch(() => null);
    const text = payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("").trim();
    if (text && text.length <= 1200) return text;
  }
  return null;
}
