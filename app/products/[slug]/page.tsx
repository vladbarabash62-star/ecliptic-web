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
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
        <div className="flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.icon}
          alt={product.name}
          className="mb-6 h-36 w-36 object-contain sm:h-44 sm:w-44"
          referrerPolicy="no-referrer"
        />
        <h1 className="text-2xl font-bold sm:text-4xl">{product.name}</h1>
        <p className="mt-3 text-white/65">
          Вы открыли страницу товара: {product.name}
        </p>
        </div>

        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-white/95">
            Доступные варианты
          </h2>

          {product.offers.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/70">
              Для этого товара прайс пока не добавлен.
            </div>
          ) : (
            <div className="grid gap-3">
              {product.offers.map((offer, index) => (
                <div
                  key={`${offer.label}-${offer.priceRub}`}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 opacity-0 animate-[itemFade_0.45s_ease-out_forwards]"
                  style={{ animationDelay: `${0.08 + index * 0.04}s` }}
                >
                  <span className="text-sm text-white/90 sm:text-base">
                    {offer.label}
                  </span>
                  <span className="rounded-lg bg-white/10 px-3 py-1 text-sm font-semibold text-white sm:text-base">
                    {offer.priceRub}₽
                  </span>
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
