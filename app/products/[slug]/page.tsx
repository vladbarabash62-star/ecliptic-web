import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, products } from "../../../lib/products";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: "Товар не найден",
    };
  }

  return {
    title: product.name,
    description: `Прайс и предложения для ${product.name}`,
  };
}

export function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#0b0d12] px-4 py-12 text-white animate-[pageFade_0.55s_ease-out]">
      <style jsx global>{`
        @keyframes pageFade {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes itemFade {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
        <div className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.icon}
            alt={product.name}
            className="mb-6 h-28 w-28 rounded-2xl border border-white/15 bg-white/[0.06] p-3 object-contain shadow-[0_10px_35px_rgba(0,0,0,0.35)] sm:h-36 sm:w-36"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-2xl font-bold text-white sm:text-4xl">{product.name}</h1>
          <p className="mt-3 text-sm text-white/75 sm:text-base">
            Выберите вариант и нажмите купить
          </p>
        </div>

        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Доступные варианты
          </h2>

          {product.offers.length === 0 ? (
            <div className="rounded-2xl border border-white/15 bg-black/30 p-4 text-white/80">
              Для этого товара прайс пока не добавлен.
            </div>
          ) : (
            <div className="grid gap-3">
              {product.offers.map((offer, index) => (
                <div
                  key={`${offer.label}-${offer.priceRub}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-[rgba(14,18,26,0.95)] px-4 py-3 opacity-0 shadow-[0_10px_26px_rgba(0,0,0,0.28)] animate-[itemFade_0.45s_ease-out_forwards]"
                  style={{ animationDelay: `${0.08 + index * 0.04}s` }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white sm:text-base">
                      {offer.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-emerald-300">
                      {offer.priceRub}₽
                    </p>
                  </div>

                  <button
                    type="button"
                    className="shrink-0 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 active:scale-[0.98]"
                  >
                    Купить
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex rounded-xl border border-white/15 px-4 py-2 text-sm text-white/90 transition hover:bg-white/10"
          >
            Назад к товарам
          </Link>
        </div>
      </div>
    </main>
  );
}
