import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "../../../lib/products";

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
    description: `Страница товара ${product.name}`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#0b0d12] px-4 py-12 text-white">
      <div className="mx-auto flex max-w-3xl flex-col items-center rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">
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

        <Link
          href="/"
          className="mt-8 inline-flex rounded-xl border border-white/15 px-4 py-2 text-sm text-white/90 transition hover:bg-white/10"
        >
          Назад к товарам
        </Link>
      </div>
    </main>
  );
}
