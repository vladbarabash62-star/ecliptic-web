/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { getProductBySlug } from "../../../lib/productStore";
import { products } from "../../../lib/products";
import {
  EpicTopupForm,
  ManagerLinkForm,
  MinecraftOrderForm,
  ProductOffersWithDetails,
  SteamTopupForm,
} from "./ProductActionForms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug, { cached: true });

  if (!product) {
    notFound();
  }

  const offers = product.offers || [];
  const hasPurchasableOffers = offers.some((offer) => offer.type !== "divider");
  const needsSteamTopup = product.slug === "steam";
  const needsEpicTopup = product.slug === "epic-games-topup";
  const needsLinkManager = product.slug === "boosty" || product.slug === "twitch";
  const needsMinecraftForm = product.slug === "minecraft";
  const detailFields =
    product.slug === "mobile-legends"
      ? [
          { id: "accountId", label: "ID аккаунта" },
          { id: "serverId", label: "ID сервера" },
        ]
      : product.slug === "pubg-mobile" || product.slug === "free-fire"
        ? [{ id: "playerId", label: "ID игрока" }]
        : [];
  const iconStyle = {
    "--icon-scale": product.iconScale ?? 1,
  } as CSSProperties;

  return (
    <main className="product-page-enter relative min-h-screen w-full overflow-x-hidden bg-transparent px-3 py-6 text-white sm:px-4 sm:py-12">
      <div className="mx-auto w-full max-w-[680px] rounded-3xl border border-white/10 bg-[#0a0d14]/82 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.34)] backdrop-blur-md sm:p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="product-icon-stage mb-5 flex h-[132px] w-[132px] items-center justify-center rounded-3xl border border-white/15 bg-[#0f1420] shadow-inner sm:h-[156px] sm:w-[156px]">
            <img
              src={product.icon}
              alt={product.name}
              className="product-icon h-[66%] w-[66%] object-contain"
              style={iconStyle}
            />
          </div>

          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            {product.name}
          </h1>
        </div>

        <section className="w-full">
          {needsSteamTopup ? (
            <SteamTopupForm productName={product.name} productSlug={product.slug} />
          ) : needsEpicTopup ? (
            <EpicTopupForm productName={product.name} productSlug={product.slug} />
          ) : needsLinkManager ? (
            <ManagerLinkForm productName={product.name} productSlug={product.slug} />
          ) : needsMinecraftForm ? (
            <MinecraftOrderForm productName={product.name} productSlug={product.slug} />
          ) : !hasPurchasableOffers ? (
            <div className="rounded-2xl border border-white/10 bg-[#0f1420]/92 p-4 text-white/70">
              Прайс для этого товара пока уточняется. Напишите нам в Telegram, и мы быстро подберём вариант.
            </div>
          ) : (
            <ProductOffersWithDetails
              productName={product.name}
              productSlug={product.slug}
              offers={offers}
              offerIcon={product.offerIcon}
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
