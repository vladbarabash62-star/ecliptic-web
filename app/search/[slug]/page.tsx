import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "../../../lib/productStore";
import { landingPageUrl, seoLandingPages, type SeoLandingPage } from "../../../lib/seoLandingPages";
import { SITE_NAME, SITE_URL, stringifyJsonLd } from "../../../lib/seo";

type SearchLandingPageProps = {
  params: Promise<{ slug: string }>;
};

function findLandingPage(slug: string) {
  return seoLandingPages.find((page) => page.slug === slug);
}

function buildSearchPageJsonLd(page: SeoLandingPage) {
  const url = landingPageUrl(page.slug);
  const mainService = page.services[0] || page.h1;

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.h1,
      url,
      description: page.description,
      inLanguage: "ru",
      isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
      },
      about: page.services.map((service) => ({
        "@type": "Thing",
        name: service,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: SITE_NAME,
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: page.h1,
          item: url,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `Можно ли оформить ${mainService} в ПМР через Ecliptic Store?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `Да. В Ecliptic Store можно оформить ${mainService}, игровые пополнения, Telegram Stars, Telegram Premium и другие цифровые товары для ПМР и Приднестровья.`,
          },
        },
        {
          "@type": "Question",
          name: "Как оформить заказ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Выберите нужный товар на сайте, нажмите кнопку покупки и отправьте заявку менеджеру Ecliptic Store в Telegram.",
          },
        },
        {
          "@type": "Question",
          name: "Работает ли Ecliptic Store для Тирасполя и всего ПМР?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Да. Ecliptic Store работает онлайн для покупателей из Тирасполя, Бендер, Рыбницы и других городов ПМР.",
          },
        },
      ],
    },
  ];
}

export async function generateStaticParams() {
  return seoLandingPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: SearchLandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = findLandingPage(slug);

  if (!page) return {};

  const title = page.title || page.h1;
  const canonical = landingPageUrl(page.slug);

  return {
    title,
    description: page.description,
    keywords: [...page.phrases, ...page.services, SITE_NAME],
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${SITE_NAME} — ${page.h1}`,
      description: page.description,
      url: canonical,
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
  const jsonLd = buildSearchPageJsonLd(page);

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden px-4 py-10 text-white sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: stringifyJsonLd(jsonLd),
        }}
      />

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

        <div className="mt-7 flex flex-wrap gap-3">
          {product ? (
            <Link
              href={`/products/${product.slug}`}
              className="inline-flex rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(16,185,129,0.24)] transition hover:bg-emerald-400"
            >
              Перейти к товару
            </Link>
          ) : null}
          <Link
            href="/"
            className="inline-flex rounded-xl border border-white/12 bg-white/[0.06] px-5 py-3 text-sm font-black text-white/82 transition hover:bg-white/[0.1] hover:text-white"
          >
            Открыть каталог Ecliptic Store
          </Link>
        </div>
      </section>
    </main>
  );
}
