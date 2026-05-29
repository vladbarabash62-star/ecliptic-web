/* eslint-disable @next/next/no-img-element */
"use client";

import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import type { ProductItem } from "../../../lib/products";
import { playBuyHaptic } from "../../components/haptics";

const TELEGRAM_USERNAME = "Ecliptic_Store_PMR";

type DetailField = {
  id: string;
  label: string;
  placeholder?: string;
};

function sellerChatHref(message?: string) {
  const url = new URL(`https://t.me/${TELEGRAM_USERNAME}`);
  if (message?.trim()) url.searchParams.set("text", message);
  return url.toString();
}

function sellerChatDeepHref(message?: string) {
  const url = new URL("tg://resolve");
  url.searchParams.set("domain", TELEGRAM_USERNAME);
  if (message?.trim()) url.searchParams.set("text", message);
  return url.toString();
}

function isMobileTelegramTarget() {
  return /android|iphone|ipad|ipod|mobile|windows phone/i.test(navigator.userAgent);
}

type TelegramWebApp = {
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string) => void;
  HapticFeedback?: {
    impactOccurred?: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
  };
};

function getTelegramWebApp() {
  return (window as Window & { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
}

async function copyOrderText(message: string) {
  try {
    await navigator.clipboard?.writeText(message);
    return;
  } catch {
    // Some mobile WebViews block clipboard. The chat still opens below.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = message;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  } catch {
    // Opening Telegram is more important than blocking the click.
  }
}

function openSellerChat(href: string, deepHref: string) {
  if (isMobileTelegramTarget()) {
    window.location.href = deepHref;
    window.setTimeout(() => {
      if (!document.hidden) window.location.href = href;
    }, 700);
    return;
  }

  const webApp = getTelegramWebApp();

  if (webApp?.openTelegramLink) {
    webApp.openTelegramLink(href);
    return;
  }

  if (webApp?.openLink) {
    webApp.openLink(href);
    return;
  }
  window.open(href, "_blank", "noopener,noreferrer");
}

function handleTelegramOrderClick(event: MouseEvent<HTMLAnchorElement>, message: string) {
  const href = sellerChatHref(message);
  const deepHref = sellerChatDeepHref(message);

  event.preventDefault();
  playBuyHaptic();
  void copyOrderText(message);
  openSellerChat(href, deepHref);
}

function TelegramOrderLink({
  message,
  productSlug,
  offer,
  className,
  children,
}: {
  message: string;
  productSlug: string;
  offer: string;
  className: string;
  children: ReactNode;
}) {
  const href = sellerChatHref(message);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-analytics="buy_click"
      data-haptic-direct="true"
      data-product={productSlug}
      data-offer={offer}
      onClick={(event) => handleTelegramOrderClick(event, message)}
      className={className}
    >
      {children}
    </a>
  );
}

function normalizeMessageLayout(message: string) {
  return message
    .replace(/\s+(📦\s*Игра:)/g, "\n$1")
    .replace(/\s+(🎮\s*Игра:)/g, "\n$1")
    .replace(/\s+(💎\s*Товар:)/g, "\n$1")
    .replace(/\s+(💰\s*К оплате:)/g, "\n$1")
    .replace(/\s+(💳\s*К оплате:)/g, "\n$1")
    .replace(/\s+(🆔\s*ID:)/g, "\n$1")
    .trim();
}

function formatPurchaseMessage(
  productName: string,
  offerLabel: string,
  priceRub: number,
  template?: string,
  details?: Record<string, string>
) {
  const filledDetails = details
    ? Object.entries(details)
        .filter(([, value]) => value.trim())
        .map(([label, value]) => `${label}: ${value.trim()}`)
    : [];

  if (template?.trim()) {
    const message = template
      .replaceAll("{product}", productName)
      .replaceAll("{offer}", offerLabel.trim())
      .replaceAll("{price}", String(priceRub));

    const normalizedMessage = normalizeMessageLayout(message);
    return filledDetails.length ? `${normalizedMessage}\n${filledDetails.join("\n")}` : normalizedMessage;
  }

  const base = `🛍 Новый заказ\n📦 Игра: ${productName}\n💎 Товар: ${offerLabel.trim()}\n💰 К оплате: ${priceRub}р`;
  return filledDetails.length ? `${base}\n${filledDetails.join("\n")}` : base;
}

function OfferIcon({ icon, scale = 1 }: { icon?: string; scale?: number }) {
  const style = {
    "--offer-icon-scale": scale,
  } as CSSProperties;

  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#07101d] text-xl shadow-inner"
      style={style}
    >
      {icon ? <img src={icon} alt="" className="offer-icon h-[62%] w-[62%] object-contain" /> : "🛒"}
    </div>
  );
}

export function SteamTopupForm({ productName, productSlug }: { productName: string; productSlug: string }) {
  const [amount, setAmount] = useState("");
  const [login, setLogin] = useState("");
  const numericAmount = Math.max(0, Number(amount) || 0);
  const rate = numericAmount >= 100 ? 20 : 21;
  const priceRub = Math.round(numericAmount * rate);
  const hasAmount = amount.trim().length > 0 && numericAmount > 0;

  const message = useMemo(
    () =>
      `Здравствуйте, хочу пополнить ${productName}.\nСумма: ${hasAmount ? `${numericAmount}$` : "не указана"}.\nSteam логин: ${login.trim()}.\nЦена: ${hasAmount ? `${priceRub} ₽` : "уточнить"}.`,
    [hasAmount, login, numericAmount, priceRub, productName]
  );

  return (
    <div className="rounded-2xl border border-white/15 bg-[#0f1420]/90 p-4">
      <div className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-bold text-white/78">Сумма пополнения ($)</span>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            className="rounded-xl border border-white/10 bg-[#07101d] px-4 py-3 text-white outline-none transition focus:border-sky-300/45"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-bold text-white/78">Steam логин</span>
          <input
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#07101d] px-4 py-3 text-white outline-none transition focus:border-sky-300/45"
          />
        </label>
      </div>
      <TelegramOrderLink
        message={message}
        productSlug={productSlug}
        offer="steam-topup"
        className="mt-4 flex w-full items-center justify-center rounded-xl bg-indigo-500 px-3 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(99,102,241,0.24)] transition-all duration-300 hover:bg-indigo-400 active:scale-95"
      >
        {hasAmount ? `Пополнить за ${priceRub} ₽ PMR` : "Пополнить"}
      </TelegramOrderLink>
    </div>
  );
}

export function EpicTopupForm({ productName, productSlug }: { productName: string; productSlug: string }) {
  const [amount, setAmount] = useState("");
  const numericAmount = Math.max(0, Number(amount) || 0);
  const priceRub = Math.round(numericAmount * 21);
  const hasAmount = amount.trim().length > 0 && numericAmount > 0;

  const message = useMemo(
    () => `Здравствуйте, хочу пополнить ${productName}. Сумма: ${hasAmount ? `${numericAmount}$` : "не указана"}. Цена: ${hasAmount ? `${priceRub} ₽` : "уточнить"}.`,
    [hasAmount, numericAmount, priceRub, productName]
  );

  return (
    <div className="rounded-2xl border border-white/15 bg-[#0f1420]/90 p-4">
      <label className="grid gap-2">
        <span className="text-sm font-bold text-white/78">Сумма пополнения ($)</span>
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
          inputMode="decimal"
          className="rounded-xl border border-white/10 bg-[#07101d] px-4 py-3 text-white outline-none transition focus:border-sky-300/45"
        />
      </label>
      <TelegramOrderLink
        message={message}
        productSlug={productSlug}
        offer="epic-topup"
        className="mt-4 flex w-full items-center justify-center rounded-xl bg-indigo-500 px-3 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(99,102,241,0.24)] transition-all duration-300 hover:bg-indigo-400 active:scale-95"
      >
        {hasAmount ? `Пополнить за ${priceRub} ₽ PMR` : "Пополнить"}
      </TelegramOrderLink>
    </div>
  );
}

export function ProductOffersWithDetails({
  productName,
  productSlug,
  offers,
  offerIcon,
  productMessageTemplate,
  fields,
}: {
  productName: string;
  productSlug: string;
  offers: ProductItem[];
  offerIcon?: string;
  productMessageTemplate?: string;
  fields: DetailField[];
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  const details = fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.label] = values[field.id] || "";
    return acc;
  }, {});

  return (
    <div className="grid w-full gap-3">
      {fields.length > 0 && (
        <div className={`grid gap-3 rounded-2xl border border-cyan-300/18 bg-cyan-950/20 p-4 ${fields.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {fields.map((field) => (
            <label key={field.id} className="grid gap-2">
              <span className="text-sm font-bold text-white/78">{field.label}</span>
              <input
                value={values[field.id] || ""}
                onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))}
                placeholder={field.placeholder}
                className="w-full rounded-xl border border-white/10 bg-[#07101d] px-4 py-3 text-white outline-none transition focus:border-sky-300/45"
              />
            </label>
          ))}
        </div>
      )}

      {offers.map((offer, index) => {
        if (offer.type === "divider") {
          return (
            <div
              key={`${offer.title}-${index}`}
              className="category-divider mt-4 first:mt-0"
              style={{ animationDelay: `${140 + index * 55}ms` }}
            >
              <div className="category-divider__line" />
              <div className="category-divider__content">
                <h3>{offer.title}</h3>
                {offer.description && <p>{offer.description}</p>}
              </div>
            </div>
          );
        }

        const message = formatPurchaseMessage(
          productName,
          offer.label,
          offer.priceRub,
          offer.messageTemplate || productMessageTemplate,
          details
        );

        return (
          <div
            key={`${offer.label}-${index}`}
            className="offer-row grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-white/15 bg-[#0f1420]/90 px-3 py-3 transition-all duration-300 hover:border-white/25 hover:bg-[#151b2a]/95"
            style={{ animationDelay: `${140 + index * 55}ms` }}
          >
            <OfferIcon icon={offer.icon || offerIcon} scale={offer.iconScale ?? 1} />
            <div className="min-w-0">
              <p className="break-words text-sm font-bold text-white sm:text-base">{offer.label}</p>
              <p className="mt-1 text-sm font-bold text-emerald-300">{offer.priceRub} ₽</p>
            </div>

            <TelegramOrderLink
              message={message}
              productSlug={productSlug}
              offer={offer.label}
              className="shrink-0 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(16,185,129,0.22)] transition-all duration-300 hover:bg-emerald-400 active:scale-95"
            >
              Купить
            </TelegramOrderLink>
          </div>
        );
      })}
    </div>
  );
}

export function MinecraftOrderForm({ productName, productSlug }: { productName: string; productSlug: string }) {
  const [values, setValues] = useState({
    nick: "",
    server: "",
  });

  const message = `🛍 Новый заказ\n📦 Игра: ${productName}\n🆔 Ник: ${values.nick.trim()}\n🌐 Сервер: ${values.server.trim()}`;

  return (
    <div className="grid w-full gap-3 rounded-2xl border border-cyan-300/18 bg-cyan-950/20 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-bold text-white/78">Ник</span>
          <input
            value={values.nick}
            onChange={(event) => setValues((current) => ({ ...current, nick: event.target.value }))}
            className="rounded-xl border border-white/10 bg-[#07101d] px-4 py-3 text-white outline-none transition focus:border-sky-300/45"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-bold text-white/78">Сервер</span>
          <input
            value={values.server}
            onChange={(event) => setValues((current) => ({ ...current, server: event.target.value }))}
            className="rounded-xl border border-white/10 bg-[#07101d] px-4 py-3 text-white outline-none transition focus:border-sky-300/45"
          />
        </label>
      </div>
      <TelegramOrderLink
        message={message}
        productSlug={productSlug}
        offer="minecraft-request"
        className="rounded-xl bg-emerald-500 px-3 py-3 text-center text-sm font-bold text-white shadow-[0_10px_24px_rgba(16,185,129,0.22)] transition-all duration-300 hover:bg-emerald-400 active:scale-95"
      >
        Написать менеджеру
      </TelegramOrderLink>
    </div>
  );
}

export function ManagerLinkForm({ productName, productSlug }: { productName: string; productSlug: string }) {
  const [link, setLink] = useState("");
  const message = `Здравствуйте, хочу купить ${productName}. Ссылка: ${link}`;

  return (
    <div className="grid w-full gap-3 rounded-2xl border border-white/15 bg-[#0f1420]/90 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
      <label className="grid min-w-0 gap-2">
        <span className="text-sm font-bold text-white/78">Ссылка:</span>
        <input
          value={link}
          onChange={(event) => setLink(event.target.value)}
          placeholder="Вставьте ссылку"
          className="rounded-xl border border-white/10 bg-[#07101d] px-4 py-3 text-white outline-none transition focus:border-sky-300/45"
        />
      </label>
      <TelegramOrderLink
        message={message}
        productSlug={productSlug}
        offer="manager-link"
        className="rounded-xl bg-emerald-500 px-3 py-3 text-center text-sm font-bold text-white shadow-[0_10px_24px_rgba(16,185,129,0.22)] transition-all duration-300 hover:bg-emerald-400 active:scale-95"
      >
        Написать менеджеру
      </TelegramOrderLink>
    </div>
  );
}
