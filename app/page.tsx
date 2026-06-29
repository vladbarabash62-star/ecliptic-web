import ProductSearchGrid from "./components/ProductSearchGrid";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getProductBySlug, getProducts } from "../lib/productStore";
import { productShouldBeIndexed } from "../lib/seo";
import { getSiteSettings } from "../lib/siteSettings";
import { defaultSiteSettings } from "../lib/siteSettingsDefaults";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeStartSlug(value: string | undefined) {
  const slug = (value || "").trim().toLowerCase();
  return /^[a-z0-9-]{1,80}$/.test(slug) ? slug : "";
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params: Record<string, string | string[] | undefined> = searchParams
    ? await searchParams
    : {};
  const startSlug = normalizeStartSlug(
    firstSearchParam(params.tgWebAppStartParam) ||
      firstSearchParam(params.startapp) ||
      firstSearchParam(params.start_param)
  );

  if (startSlug) {
    const product = await getProductBySlug(startSlug);
    if (product) redirect(`/products/${product.slug}?app=1`);
  }

  const [allProducts, settings] = await Promise.all([
    getProducts(),
    getSiteSettings().catch(() => defaultSiteSettings),
  ]);
  const products = allProducts.filter(productShouldBeIndexed);

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-transparent px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="page-intro mb-6 text-center sm:mb-8">
          <h1 className="flex items-center justify-center gap-2 text-3xl font-bold sm:gap-3 sm:text-4xl md:text-6xl">
            <span>Ecliptic Store</span>
            <Image
              src="/loading-icon.png"
              alt=""
              width={80}
              height={80}
              className="h-[1em] w-[1em] object-contain"
            />
          </h1>

          {/*
            Ecliptic Store помогает оформить донат, игровые пополнения и
            подписки в Тирасполе, Приднестровье и ПМР: Steam, Telegram Premium,
            Telegram Stars, Brawl Stars, Roblox, PUBG Mobile, Standoff 2,
            PlayStation, Minecraft, Discord Nitro и другие цифровые товары.
          */}

        </div>

        <div className="desktop-trust-panel mx-auto mb-7 hidden w-full max-w-[680px] items-center justify-center gap-5 rounded-2xl border border-white/10 px-6 py-4 text-sm font-bold uppercase shadow-[0_18px_70px_rgba(14,165,233,0.14)] md:flex">
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
