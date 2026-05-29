import ProductSearchGrid from "./components/ProductSearchGrid";
import { getProducts } from "../lib/productStore";
import { getSiteSettings } from "../lib/siteSettings";
import { defaultSiteSettings } from "../lib/siteSettingsDefaults";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [products, settings] = await Promise.all([
    getProducts({ cached: true }),
    getSiteSettings({ cached: true }).catch(() => defaultSiteSettings),
  ]);

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-transparent px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="page-intro mb-6 text-center sm:mb-8">
          <h1 className="text-3xl font-bold sm:text-4xl md:text-6xl">
            Ecliptic Store
          </h1>

          <p className="mt-2 text-sm text-white/60 sm:text-base">
            Интернет-магазин цифровых товаров
          </p>

          <p className="hidden">
            Ecliptic Store — интернет магазин. Оформление интернет-покупок в
            Приднестровье. Пополнение Steam, Telegram Premium, Telegram Stars,
            Brawl Stars, Roblox, Standoff 2, PUBG Mobile, Free Fire, Minecraft,
            PlayStation, Epic Games и другие цифровые товары.
          </p>
        </div>

        <div className="desktop-trust-panel mb-7 hidden w-full items-center justify-center gap-5 rounded-2xl border border-white/10 px-6 py-4 text-sm font-bold uppercase shadow-[0_18px_70px_rgba(14,165,233,0.14)] md:flex">
          <a
            href="https://t.me/Ecliptic_Store_Reviews"
            target="_blank"
            rel="noopener noreferrer"
            data-analytics="reviews_click"
            className="rounded-full bg-white/12 px-5 py-2 text-white shadow-inner transition hover:bg-white/18"
          >
            Отзывы
          </a>
          <span className="tracking-wide text-white/95">
            {settings.reviewsCountLabel} успешных покупок <span className="text-emerald-300">✓</span>
          </span>
        </div>

        <ProductSearchGrid products={products} />
      </div>
    </main>
  );
}
