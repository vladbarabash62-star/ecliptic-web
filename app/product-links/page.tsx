import type { Metadata } from "next";
import { getProducts } from "../../lib/productStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Ecliptic Store — Ссылки на товары",
  robots: {
    index: false,
    follow: false,
  },
};

const SITE_URL = "https://ecliptic.website";

function getTelegramBotUsername() {
  const username =
    process.env.TELEGRAM_WEBAPP_BOT_USERNAME ||
    process.env.NEXT_PUBLIC_TELEGRAM_WEBAPP_BOT_USERNAME ||
    "Ecliptic_Store_BOT";

  const normalized = username.replace(/^@/, "").trim();
  return /^[a-zA-Z0-9_]{5,32}$/.test(normalized) ? normalized : "";
}

function getTelegramMiniAppShortName() {
  const shortName =
    process.env.TELEGRAM_WEBAPP_SHORT_NAME ||
    process.env.NEXT_PUBLIC_TELEGRAM_WEBAPP_SHORT_NAME ||
    "Ecliptic_Store";

  return /^[a-zA-Z0-9_]{3,64}$/.test(shortName) ? shortName : "";
}

function getTelegramMiniAppLink(slug: string) {
  const botUsername = getTelegramBotUsername();
  const miniAppShortName = getTelegramMiniAppShortName();
  if (!botUsername || !miniAppShortName) return `${SITE_URL}/go/${slug}`;

  return `https://t.me/${botUsername}/${miniAppShortName}?startapp=${slug}`;
}

export default async function ProductLinksPage() {
  const products = await getProducts();
  const listText = products
    .map((product) => `${product.name}: ${getTelegramMiniAppLink(product.slug)}`)
    .join("\n");

  return (
    <main className="product-page-enter flex-1 px-4 py-8 text-white sm:py-12">
      <div className="mx-auto w-full max-w-[860px] rounded-3xl border border-white/10 bg-[#0a0d14]/82 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.34)] backdrop-blur-md sm:p-8">
        <h1 className="text-3xl font-black sm:text-4xl">Ссылки на товары</h1>
        <p className="mt-3 text-sm leading-6 text-white/58">
          Эти ссылки вставляй в Telegram-канал. Они открывают товар через Telegram Mini App, чтобы Telegram мог передать username в аналитику.
        </p>

        <textarea
          readOnly
          value={listText}
          className="mt-6 h-[320px] w-full resize-y rounded-2xl border border-white/10 bg-[#07101d] p-4 text-sm leading-7 text-white outline-none focus:border-sky-300/45"
        />

        <div className="mt-6 grid gap-3">
          {products.map((product) => (
            <a
              key={product.slug}
              href={`/go/${product.slug}`}
              className="grid gap-1 rounded-2xl border border-white/10 bg-[#0f1420]/88 px-4 py-3 transition hover:border-white/20 hover:bg-[#151b2a]/95"
            >
              <span className="font-black text-white">{product.name}</span>
              <span className="break-all text-sm text-sky-200/76">{getTelegramMiniAppLink(product.slug)}</span>
              <span className="break-all text-xs text-white/42">Запасная ссылка: {SITE_URL}/go/{product.slug}</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
