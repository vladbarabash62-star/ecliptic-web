import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "../../../lib/productStore";
import { landingPageUrl, seoLandingPages } from "../../../lib/seoLandingPages";
import { SITE_NAME } from "../../../lib/seo";

type SearchLandingPageProps = {
  params: Promise<{ slug: string }>;
};

function findLandingPage(slug: string) {
  return seoLandingPages.find((page) => page.slug === slug);
}

export async function generateStaticParams() {
  return seoLandingPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: SearchLandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = findLandingPage(slug);

  if (!page) return {};

  return {
    title: page.title,
    description: page.description,
    keywords: [...page.phrases, ...page.services, SITE_NAME],
    alternates: {
      canonical: landingPageUrl(page.slug),
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: landingPageUrl(page.slug),
      siteName: SITE_NAME,
      locale: "ru_RU",
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function SearchLandingPage({ params }: SearchLandingPageProps) {
  const { slug } = await params;
  const page = findLandingPage(slug);

  if (!page) notFound();

  const product = page.productSlug ? await getProductBySlug(page.productSlug) : null;

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden px-4 py-10 text-white sm:py-14">
      <section className="mx-auto w-full max-w-[1080px]">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300/85">
          {SITE_NAME}
        </p>
        <h1 className="mt-3 text-3xl font-black sm:text-5xl">{page.h1}</h1>
        <p className="mt-4 max-w-[780px] text-base leading-7 text-white/68">{page.intro}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
            <h2 className="text-xl font-black">Популярные запросы</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {page.phrases.map((phrase) => (
                <span key={phrase} className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-sm text-white/75">
                  {phrase}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
            <h2 className="text-xl font-black">Что можно оформить</h2>
            <ul className="mt-4 grid gap-2 text-sm text-white/72">
              {page.services.map((service) => (
                <li key={service}>• {service}</li>
              ))}
            </ul>
          </div>
        </div>

        {product && (
          <Link
            href={`/products/${product.slug}`}
            className="mt-7 inline-flex rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(16,185,129,0.24)] transition hover:bg-emerald-400"
          >
            Перейти к товару
          </Link>
        )}
      </section>
    </main>
  );
}

