import { notFound } from "next/navigation";
import { getProductBySlug } from "../../../lib/products";

type PageProps = {
  params: {
    slug: string;
  };
};

type ProductOption = {
  label: string;
  price?: string;
  priceRub?: number;
};

export default function ProductPage({ params }: PageProps) {
  const product = getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const options: ProductOption[] =
    (product as any).options || (product as any).offers || [];

  const telegramUsername = "Ecliptic_Store_PMR";

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-transparent px-3 py-6 text-white sm:px-4 sm:py-12">
      <div className="mx-auto w-full max-w-[620px] rounded-3xl border border-white/10 bg-[#0a0d14]/80 p-4 backdrop-blur-md sm:p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex h-[120px] w-[120px] items-center justify-center rounded-2xl border border-white/15 bg-[#0f1420] sm:h-[140px] sm:w-[140px]">
            <img
              src={product.icon}
              alt={product.name}
              className="h-[90px] w-[90px] object-contain sm:h-[110px] sm:w-[110px]"
            />
          </div>

          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            {product.name}
          </h1>

          <p className="mt-3 text-sm text-white/60 sm:text-base">
            Выберите вариант и нажмите купить
          </p>
        </div>

        <section className="w-full">
          <h2 className="mb-4 text-xl font-bold text-white">
            Доступные варианты
          </h2>

          {options.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0f1420] p-4 text-white/70">
              Для этого товара прайс пока не добавлен.
            </div>
          ) : (
            <div className="grid w-full gap-3">
              {options.map((option, index) => {
                const price =
                  option.price ||
                  (option.priceRub ? `${option.priceRub}₽` : "");

                const message = `Здравствуйте, хочу купить ${product.name}: ${option.label} ${price}`;

                return (
                  <div
                    key={`${option.label}-${index}`}
                    className="grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-white/15 bg-[#0f1420]/90 px-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-white sm:text-base">
                        {option.label}
                      </p>

                      <p className="mt-1 text-sm font-bold text-emerald-300">
                        {price}
                      </p>
                    </div>

                    <a
                      href={`https://t.me/${telegramUsername}?text=${encodeURIComponent(
                        message
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-white transition-all duration-300 hover:bg-emerald-400 active:scale-95"
                    >
                      Купить
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}