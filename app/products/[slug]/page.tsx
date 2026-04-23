import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, products } from "../../../lib/products";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

type Offer = {
  label: string;
  priceRub: number;
};

type OfferGroup = {
  title: string;
  offers: Offer[];
};

function buildTelegramMessage(
  product: { name: string; slug: string },
  offer: Offer
) {
  if (product.slug === "telegram-accounts") {
    return `Здравствуйте, хочу приобрести Telegram аккаунт, регион ${offer.label} по цене ${offer.priceRub} рублей`;
  }

  const cleanedLabel = offer.label
    .replace(new RegExp(product.name, "ig"), "")
    .replace(/\s{2,}/g, " ")
    .trim();

  const topUpLabel =
    /\$|uc|coins?|robux|гем|алмаз|голд|золот|донат валют|dp|mc/i.test(cleanedLabel);
  const passOrSubscription =
    /pass|premium|подписк|месяц|дней|дня|день/i.test(cleanedLabel);

  if (topUpLabel) {
    return `Здравствуйте, хочу пополнить ${product.name} на ${cleanedLabel} по цене ${offer.priceRub} рублей`;
  }

  if (passOrSubscription) {
    return `Здравствуйте, хочу оформить ${cleanedLabel} для ${product.name} по цене ${offer.priceRub} рублей`;
  }

  return `Здравствуйте, хочу приобрести ${cleanedLabel} для ${product.name} по цене ${offer.priceRub} рублей`;
}

function splitOffersByGroups(slug: string, offers: Offer[]): OfferGroup[] {
  if (offers.length === 0) {
    return [];
  }

  const buildGroups = (definitions: Array<{ title: string; match: (label: string) => boolean }>) =>
    definitions
      .map((definition) => ({
        title: definition.title,
        offers: offers.filter((offer) => definition.match(offer.label)),
      }))
      .filter((group) => group.offers.length > 0);

  switch (slug) {
    case "brawl-stars":
      return buildGroups([
        { title: "Пропуски", match: (label) => /pass/i.test(label) },
        { title: "Гемы", match: (label) => /гем/i.test(label) },
      ]);
    case "pubg-mobile":
      return buildGroups([
        { title: "UC", match: (label) => /\buc\b/i.test(label) },
        { title: "Premium", match: (label) => /^premium\b/i.test(label) },
        { title: "Premium+", match: (label) => /^premium\+/i.test(label) },
        { title: "Elite Pass", match: (label) => /elite pass/i.test(label) },
      ]);
    case "mobile-legends":
      return buildGroups([
        { title: "Алмазы", match: (label) => /алмаз/i.test(label) && !/пропуск/i.test(label) },
        { title: "Пропуски", match: (label) => /пропуск/i.test(label) },
      ]);
    case "clash-royale":
      return buildGroups([
        { title: "Pass Royale", match: (label) => /pass royale/i.test(label) },
        { title: "Гемы", match: (label) => /гем/i.test(label) },
      ]);
    case "clash-of-clans":
      return buildGroups([
        { title: "Гемы", match: (label) => /гем/i.test(label) },
        { title: "Оформление", match: (label) => /оформление/i.test(label) },
      ]);
    case "world-of-tanks":
      return buildGroups([
        { title: "Золото", match: (label) => /золот/i.test(label) },
        { title: "Подписка", match: (label) => /подписк/i.test(label) },
      ]);
    case "roblox":
      return buildGroups([
        { title: "Robux", match: (label) => /robux/i.test(label) },
        { title: "Premium", match: (label) => /premium/i.test(label) },
      ]);
    case "telegram-premium":
      return buildGroups([
        { title: "Со входом", match: (label) => /со входом/i.test(label) },
        { title: "Без входа", match: (label) => /без входа/i.test(label) },
      ]);
    case "gta-5-rp-majestic-rp":
      return buildGroups([
        { title: "Игровая валюта", match: (label) => /\$\s*$/i.test(label) },
        { title: "DP / MC", match: (label) => /\b(dp|mc)\b/i.test(label) },
      ]);
    default:
      return [{ title: "Все варианты", offers }];
  }
}

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
  const telegramUsername = "Ecliptic_Store_PMR";
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const offerGroups = splitOffersByGroups(product.slug, product.offers);

  return (
    <main className="min-h-screen bg-[#0b0d12] px-4 py-12 text-white animate-[pageFade_0.55s_ease-out]">
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

          {offerGroups.length === 0 ? (
            <div className="rounded-2xl border border-white/15 bg-black/30 p-4 text-white/80">
              Для этого товара прайс пока не добавлен.
            </div>
          ) : (
            <div className="grid gap-5">
              {offerGroups.map((group, groupIndex) => (
                <div key={group.title} className="rounded-2xl border border-white/10 bg-black/15 p-3 sm:p-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/75">
                    {group.title}
                  </h3>

                  <div className="grid gap-3">
                    {group.offers.map((offer, index) => (
                      <div
                        key={`${group.title}-${offer.label}-${offer.priceRub}`}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-[rgba(14,18,26,0.95)] px-4 py-3 opacity-0 shadow-[0_10px_26px_rgba(0,0,0,0.28)] animate-[itemFade_0.45s_ease-out_forwards]"
                        style={{
                          animationDelay: `${0.08 + (groupIndex * 0.12 + index * 0.04)}s`,
                        }}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white sm:text-base">
                            {offer.label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-emerald-300">
                            {offer.priceRub}₽
                          </p>
                        </div>

                        <a
                          href={`https://t.me/${telegramUsername}?text=${encodeURIComponent(buildTelegramMessage(product, offer))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 active:scale-[0.98]"
                        >
                          Купить
                        </a>
                      </div>
                    ))}
                  </div>
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
