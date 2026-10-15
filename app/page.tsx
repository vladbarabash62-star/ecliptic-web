import ProductSearchGrid from "./components/ProductSearchGrid";
import HomeQueryGate from "./components/HomeQueryGate";
import Image from "next/image";
import { getProducts } from "../lib/productStore";
import { withOptimizedProductsImages } from "../lib/optimizedImages";
import { getSiteSettings } from "../lib/siteSettings";
import { defaultSiteSettings } from "../lib/siteSettingsDefaults";

export const revalidate = 0;

export default async function HomePage() {
  const [allProducts, settings] = await Promise.all([
    getProducts({ cached: false }),
    getSiteSettings().catch(() => defaultSiteSettings),
  ]);
  const products = withOptimizedProductsImages(allProducts)
    .map((product) => ({
      name: product.name,
      slug: product.slug,
      icon: product.icon,
      iconScale: product.iconScale,
    }));

  return (
    <HomeQueryGate>
      <main className="relative min-h-screen w-full overflow-x-hidden bg-transparent px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="home-reveal home-reveal--intro page-intro mb-6 text-center sm:mb-8">
          <h1 className="flex items-center justify-center gap-2 text-4xl font-bold sm:gap-3 sm:text-5xl md:text-7xl">
            <span>Ecliptic Store</span>
            <Image
              src="/loading-icon.png"
              alt=""
              width={80}
              height={80}
              className="h-[1.45em] w-[1.45em] object-contain"
            />
          </h1>

          {/*
            Ecliptic Store помогает оформить донат, игровые пополнения и
            подписки в Тирасполе, Приднестровье и ПМР: Steam, Telegram Premium,
            Telegram Stars, Brawl Stars, Roblox, PUBG Mobile, Standoff 2,
            PlayStation, Minecraft, Discord Nitro и другие цифровые товары.
          */}

        </div>

        <div className="home-reveal home-reveal--trust desktop-trust-panel mx-auto mb-7 hidden w-full max-w-[680px] items-center justify-center gap-5 rounded-2xl border border-white/10 px-6 py-4 text-[17px] font-bold uppercase shadow-[0_18px_70px_rgba(14,165,233,0.14)] md:flex">
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
            {settings.reviewsCountLabel} успешных покупок <span className="text-lg text-emerald-300">✓</span>
          </span>
        </div>

        <ProductSearchGrid products={products} />
      </div>
      </main>
    </HomeQueryGate>
  );
}
