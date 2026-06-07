import type { Metadata } from "next";
import { getProducts } from "../../lib/productStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Ссылки на товары",
  robots: {
    index: false,
    follow: false,
  },
};

const SITE_URL = "https://ecliptic.website";

export default async function ProductLinksPage() {
  const products = await getProducts();
  const listText = products
    .map((product) => `${product.name}: ${SITE_URL}/go/${product.slug}`)
    .join("\n");

  return (
    <main className="product-page-enter flex-1 px-4 py-8 text-white sm:py-12">
      <div className="mx-auto w-full max-w-[860px] rounded-3xl border border-white/10 bg-[#0a0d14]/82 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.34)] backdrop-blur-md sm:p-8">
        <h1 className="text-3xl font-black sm:text-4xl">Ссылки на товары</h1>
        <p className="mt-3 text-sm leading-6 text-white/58">
          Эти ссылки можно вставлять в Telegram-лист. На ПК они открывают сайт, на телефоне открывают мобильное веб-приложение товара.
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
              <span className="break-all text-sm text-sky-200/76">{SITE_URL}/go/{product.slug}</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
