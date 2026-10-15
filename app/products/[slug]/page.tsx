/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { getProductBySlug } from "../../../lib/productStore";
import { withOptimizedProductImages } from "../../../lib/optimizedImages";
import { products } from "../../../lib/products";
import {
  buildProductJsonLd,
  buildProductMetadata,
  SITE_NAME,
  stringifyJsonLd,
} from "../../../lib/seo";
import {
  EpicTopupForm,
  ManagerButtonForm,
  ManagerLinkForm,
  MinecraftOrderForm,
  ProductOffersWithDetails,
  SiteTopupForm,
  SbpPaymentForm,
  SteamTopupForm,
  RpTopupForm,
} from "./ProductActionForms";

export const revalidate = 300;

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function isManagerButtonOnlyProduct(product: { name: string; slug: string }) {
  const name = product.name.trim().toLowerCase();

  return (
    product.slug === "transfers" ||
    product.slug.startsWith("card-withdrawal") ||
    name === "переводы" ||
    name.includes("вывод с карты")
  );
}

function numberedServers(count: number) {
  return Array.from({ length: count }, (_, index) => `Сервер ${index + 1}`);
}

const RADMIR_SERVERS = numberedServers(21);
const AMAZING_SERVERS = ["RED", "YELLOW", "GREEN", "AZURE", "SILVER", "ROSE", "BLACK", "SKY", "TITAN", "X", "FIRE", "LIME"];
const BLACK_RUSSIA_SERVERS = numberedServers(92);

export function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug, { cached: true }).then((item) => (item ? withOptimizedProductImages(item) : item));

  if (!product) {
    return {
      title: `Товар не найден | ${SITE_NAME}`,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return buildProductMetadata(product);
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug, { cached: true }).then((item) => (item ? withOptimizedProductImages(item) : item));

  if (!product) {
    notFound();
  }

  const offers = product.offers || [];
  const hasPurchasableOffers = offers.some((offer) => offer.type !== "divider");
  const needsSteamTopup = product.slug === "steam";
  const needsEpicTopup = product.slug === "epic-games-topup";
  const needsSbpPayment = product.slug === "sbp-payment";
  const needsSiteTopup = product.slug === "site-topups";
  const needsManagerButton = isManagerButtonOnlyProduct(product);
  const needsLinkManager =
    product.slug === "boosty" || product.slug === "twitch";
  const needsMinecraftForm = product.slug === "minecraft";
  const isGrandProduct = /grand/i.test(product.name) || ["grand-rp", "grand-mobile"].includes(product.slug);
  const rpServers = product.slug === "radmir-rp" ? RADMIR_SERVERS
    : product.slug === "amazing-rp" ? AMAZING_SERVERS
    : product.slug === "black-russia" ? BLACK_RUSSIA_SERVERS : undefined;
  const needsRpTopup = isGrandProduct || Boolean(rpServers);
  const detailFields =
    product.slug === "mobile-legends"
      ? [
          { id: "accountId", label: "ID аккаунта", placeholder: "Введите ID аккаунта", numeric: true },
          { id: "serverId", label: "ID сервера", placeholder: "Введите ID сервера", numeric: true },
        ]
      : product.slug === "brawl-stars" || product.slug === "clash-of-clans" || product.slug === "clash-royale"
        ? [{ id: "email", label: "Почта аккаунта", placeholder: "Введите почту аккаунта" }]
      : product.slug === "radmir-rp"
        ? [
            { id: "nick", label: "Ник", placeholder: "Введите ваш ник" },
            { id: "server", label: "Сервер", placeholder: "Выберите сервер", options: RADMIR_SERVERS },
          ]
      : product.slug === "amazing-rp"
        ? [
            { id: "nick", label: "Ник", placeholder: "Введите ваш ник" },
            { id: "server", label: "Сервер", placeholder: "Выберите сервер", options: AMAZING_SERVERS },
          ]
      : product.slug === "black-russia"
        ? [
            { id: "nick", label: "Ник", placeholder: "Введите ваш ник" },
            { id: "server", label: "Сервер", placeholder: "Выберите сервер", options: BLACK_RUSSIA_SERVERS },
          ]
      : product.slug === "delta-force"
        ? [
            { id: "playerId", label: "ID игрока", placeholder: "Введите ID игрока", numeric: true },
            { id: "platform", label: "Платформа", placeholder: "Выберите платформу", options: ["ПК", "Mobile", "Консоль"] },
          ]
      : product.slug === "pubg-mobile" || product.slug === "free-fire" || product.slug === "standoff-2"
        ? [{ id: "playerId", label: "ID аккаунта", placeholder: "Введите ID аккаунта", numeric: true }]
        : [];
  const iconStyle = {
    "--icon-scale": product.iconScale ?? 1,
  } as CSSProperties;
  const productJsonLd = buildProductJsonLd(product);

  return (
    <main className="product-page-enter relative min-h-screen w-full overflow-x-hidden bg-transparent px-3 py-6 text-white sm:px-4 sm:py-12">
      {productJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: stringifyJsonLd(productJsonLd),
          }}
        />
      ) : null}

      <div className="mx-auto w-full max-w-[680px] rounded-3xl border border-white/10 bg-[#0a0d14]/82 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.34)] backdrop-blur-md sm:p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="product-icon-stage mb-5 flex h-[132px] w-[132px] items-center justify-center rounded-3xl border border-white/15 bg-[#0f1420] shadow-inner sm:h-[156px] sm:w-[156px]">
            <img
              src={product.icon}
              alt={product.name}
              className="product-icon h-[66%] w-[66%] object-contain"
              width={180}
              height={180}
              decoding="async"
              fetchPriority="high"
              style={iconStyle}
            />
          </div>

          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            {product.name}
          </h1>
        </div>

        <section className="w-full">
          {needsRpTopup ? (
            <RpTopupForm productName={product.name} productSlug={product.slug} servers={rpServers} usePlayerId={isGrandProduct} rublesPerPmr={10 / 3} />
          ) : needsSteamTopup ? (
            <SteamTopupForm productName={product.name} productSlug={product.slug} />
          ) : needsEpicTopup ? (
            <EpicTopupForm productName={product.name} productSlug={product.slug} />
          ) : needsSbpPayment ? (
            <SbpPaymentForm productName={product.name} productSlug={product.slug} />
          ) : needsSiteTopup ? (
            <SiteTopupForm productName={product.name} productSlug={product.slug} />
          ) : needsManagerButton ? (
            <ManagerButtonForm productName={product.name} productSlug={product.slug} />
          ) : needsLinkManager ? (
            <ManagerLinkForm productName={product.name} productSlug={product.slug} />
          ) : needsMinecraftForm ? (
            <MinecraftOrderForm productName={product.name} productSlug={product.slug} />
          ) : !hasPurchasableOffers ? (
            <ManagerButtonForm productName={product.name} productSlug={product.slug} />
          ) : (
            <ProductOffersWithDetails
              productName={product.name}
              productSlug={product.slug}
              offers={offers}
              offerIcon={product.offerIcon}
              productIcon={product.icon}
              productMessageTemplate={product.messageTemplate}
              fields={detailFields}
            />
          )}
        </section>

        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            prefetch
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 transition-all duration-300 hover:bg-white/10 active:scale-95"
          >
            <span className="sm:hidden">Назад</span>
            <span className="hidden sm:inline">Вернуться на главную страницу</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
