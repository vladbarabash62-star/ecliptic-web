import type { Metadata } from "next";
import Link from "next/link";
import { buildSearchTags } from "../../lib/searchTags";
import { SITE_NAME, SITE_URL } from "../../lib/seo";
import { seoLandingPages } from "../../lib/seoLandingPages";

export const metadata: Metadata = {
  title: `Поисковые теги | ${SITE_NAME}`,
  description:
    "Поисковые направления Ecliptic Store: донат, игровые пополнения, подписки и цифровые товары в ПМР, Тирасполе и Приднестровье.",
  alternates: {
    canonical: `${SITE_URL}/tags`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TagsPage() {
  const tags = buildSearchTags();

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden px-4 py-10 text-white sm:py-14">
      <section className="mx-auto w-full max-w-[1200px]">
        <div className="mb-8 max-w-[820px]">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300/85">
            Ecliptic Store
          </p>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">
            Популярные поисковые запросы
          </h1>
          <p className="mt-4 text-base leading-7 text-white/64">
            Страница с направлениями магазина: игровые пополнения, подписки,
            цифровые товары, донат и сервисы для покупателей из ПМР,
            Тирасполя и Приднестровья.
          </p>
        </div>

        <div className="mb-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {seoLandingPages.map((page) => (
            <Link
              key={page.slug}
              href={`/search/${page.slug}`}
              className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition hover:border-emerald-300/35 hover:bg-white/[0.065]"
            >
              <h2 className="text-base font-black text-white">{page.h1}</h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/62">{page.description}</p>
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/72"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
