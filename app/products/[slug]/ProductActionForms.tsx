/* eslint-disable @next/next/no-img-element */
"use client";

import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { ProductItem } from "../../../lib/products";
import { realOfferIcon } from "../../../lib/offerImages";
import { playBuyHaptic } from "../../components/haptics";

const TELEGRAM_USERNAME = "Ecliptic_Store_PMR";
const REQUIRED_FIELDS_MESSAGE = "Заполните все поля.";

type DetailField = {
  id: string;
  label: string;
  placeholder?: string;
  numeric?: boolean;
};

function sellerChatHref(message?: string) {
  const text = message?.trim();
  return text
    ? `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(text)}`
    : `https://t.me/${TELEGRAM_USERNAME}`;
}

function sellerChatDeepHref(message?: string) {
  const text = message?.trim();
  return text
    ? `tg://resolve?domain=${encodeURIComponent(TELEGRAM_USERNAME)}&text=${encodeURIComponent(text)}`
    : `tg://resolve?domain=${encodeURIComponent(TELEGRAM_USERNAME)}`;
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
  const webApp = getTelegramWebApp();

  if (webApp?.openTelegramLink) {
    webApp.openTelegramLink(href);
    return;
  }

  if (webApp?.openLink) {
    webApp.openLink(href);
    return;
  }

  if (isMobileTelegramTarget()) {
    window.location.href = deepHref;
    window.setTimeout(() => {
      if (!document.hidden) window.location.href = href;
    }, 700);
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

function useOrderNotice() {
  const [notice, setNotice] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  function showNotice(message: string) {
    setNotice(message);
    setIsVisible(true);
    window.setTimeout(() => setIsVisible(false), 5000);
    window.setTimeout(() => setNotice(""), 5550);
  }

  return { notice, isVisible, showNotice };
}

function OrderNotice({ message, isVisible }: { message: string; isVisible: boolean }) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      data-show={isVisible}
      className="fixed bottom-4 left-1/2 z-[9999] w-[min(92vw,420px)] translate-y-24 -translate-x-1/2 rounded-2xl border border-red-300/35 bg-red-950/95 px-5 py-4 text-center text-sm font-bold text-red-50 opacity-0 shadow-[0_18px_44px_rgba(239,68,68,0.26)] backdrop-blur transition-all duration-500 data-[show=true]:translate-y-0 data-[show=true]:opacity-100 sm:bottom-auto sm:top-4 sm:-translate-y-24 sm:data-[show=true]:translate-y-0"
    >
      {message}
    </div>,
    document.body
  );
}

function TelegramOrderLink({
  message,
  productSlug,
  offer,
  priceRub,
  className,
  validate,
  onInvalid,
  children,
}: {
  message: string;
  productSlug: string;
  offer: string;
  priceRub?: number;
  className: string;
  validate?: () => string | null;
  onInvalid?: (message: string) => void;
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
      data-price={Number.isFinite(priceRub) ? String(priceRub) : undefined}
      onClick={(event) => {
        const validationMessage = validate?.();
        if (validationMessage) {
          event.preventDefault();
          onInvalid?.(validationMessage);
          return;
        }

        handleTelegramOrderClick(event, message);
      }}
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

function normalizeOrderMessage(message: string) {
  return normalizeMessageLayout(message)
    .replace(/\s+(?=(?:📱|📦|💵|💎|💰|🆔|🌐|🎮|🎁|🔗)\s*)/g, "\n")
    .replace(/\s+(📦\s*(?:Игра|Сервис):)/g, "\n$1")
    .replace(/\s+(🎮\s*(?:Игра|Сервис):)/g, "\n$1")
    .replace(/\s+(💎\s*Товар:)/g, "\n$1")
    .replace(/\s+(💵\s*Сумма:)/g, "\n$1")
    .replace(/\s+(📱\s*Платформа:)/g, "\n$1")
    .replace(/\s+(💰\s*К оплате:)/g, "\n$1")
    .replace(/\s+(💳\s*К оплате:)/g, "\n$1")
    .replace(/\s+(🆔\s*(?:ID|Ник):)/g, "\n$1")
    .replace(/\s+(🌐\s*Сервер:)/g, "\n$1")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim().replace(/[.。]+$/, ""))
    .filter(Boolean)
    .filter((line) => !isOrderGreetingLine(line))
    .join("\n")
    .trim();
}

function isOrderGreetingLine(line: string) {
  return /(?:\u00F0\u009F\u0091\u008B|👋|здрав|хочу|почу|пополнить\s+баланс|баланс\s+telegram|telegram\s+stars.*баланс|[\uFFFD]{1,}.*telegram\s+stars|Р·РґСЂ|РҐРѕС‡|РџРѕС‡|РїРѕРїРѕР»РЅРёС‚СЊ\s+Р±Р°Р»Р°РЅСЃ|Р±Р°Р»Р°РЅСЃ\s+telegram)/iu.test(line);
}

function appendDetails(message: string, details: string[]) {
  return details.length ? `${message}\n${details.join("\n")}` : message;
}

function formatKnownPurchaseMessage(productName: string, offerLabel: string, priceRub: number) {
  const offer = offerLabel.trim();

  if (productName === "PlayStation") {
    const service = offer.toLowerCase().includes("plus")
      ? "PS Plus"
      : offer.toLowerCase().includes("аккаунт")
        ? "PSN аккаунт"
        : "PSN";

    return normalizeOrderMessage(
      `🛍 Новый заказ\n📱 Платформа: PlayStation\n📦 Сервис: ${service}\n💵 Сумма: ${offer}\n💰 К оплате: ${priceRub}р`
    );
  }

  if (productName.toLowerCase().includes("telegram аккаунт")) {
    return normalizeOrderMessage(
      `🛍 Новый заказ\n📱 Платформа: Telegram\n📦 Товар: аккаунт\n🌐 Регион: ${offer}\n💰 К оплате: ${priceRub}р`
    );
  }

  return "";
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

  const knownMessage = formatKnownPurchaseMessage(productName, offerLabel, priceRub);
  if (knownMessage) return appendDetails(knownMessage, filledDetails);

  if (template?.trim()) {
    const message = template
      .replaceAll("{product}", productName)
      .replaceAll("{offer}", offerLabel.trim())
      .replaceAll("{price}", String(priceRub));

    const normalizedMessage = normalizeOrderMessage(message);
    return appendDetails(normalizedMessage, filledDetails);
  }

  const base = `🛍 Новый заказ\n📦 Сервис: ${productName}\n💎 Товар: ${offerLabel.trim()}\n💰 К оплате: ${priceRub}р`;
  return appendDetails(normalizeOrderMessage(base), filledDetails);
}

function topupServiceName(productName: string) {
  return productName
    .replace(/^Пополнение\s+/i, "")
    .replace(/\s+пополнение$/i, "")
    .trim() || productName;
}

function fallbackOfferIcon(productSlug: string, label: string) {
  return realOfferIcon(productSlug, label);
}

function formatPriceTag(priceRub: number) {
  return `${priceRub} р`;
}

function priceTagFontSize(priceRub: number) {
  if (priceRub >= 1000) return 25;
  if (priceRub >= 300) return 24;
  if (priceRub >= 100) return 23;
  if (priceRub >= 50) return 22;
  return 20;
}

function priceTagStyle(priceRub: number) {
  return {
    "--offer-price-size": `${priceTagFontSize(priceRub)}px`,
  } as CSSProperties;
}

const CURRENCY_RUB = "\u20BD";
const CURRENCY_PMR = "Р ПМР";
const CURRENCY_USD = "$";
const CURRENCY_EUR = "\u20AC";

const SITE_TOPUP_MINIMUMS: Record<string, { amount: number; label: string }> = {
  [CURRENCY_RUB]: { amount: 100, label: "100р РФ" },
  [CURRENCY_PMR]: { amount: 30, label: "30р ПМР" },
  [CURRENCY_USD]: { amount: 2, label: "2$" },
  [CURRENCY_EUR]: { amount: 2, label: `2${CURRENCY_EUR}` },
};

function compactDividerTitle(title: string) {
  const normalizedTitle = title.trim();
  const compactTitles: Record<string, string> = {
    "Roblox Premium": "Premium",
    "Individual Premium": "Premium",
    "Duo Premium": "Duo",
    "PSN Турция": "PSN",
  };

  return compactTitles[normalizedTitle] || normalizedTitle;
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
      {icon ? <img src={icon} alt="" loading="lazy" decoding="async" className="offer-icon h-[62%] w-[62%] object-contain" /> : "🛒"}
    </div>
  );
}

export function SteamTopupForm({ productName, productSlug }: { productName: string; productSlug: string }) {
  const [amount, setAmount] = useState("");
  const [login, setLogin] = useState("");
  const { notice, isVisible, showNotice } = useOrderNotice();
  const numericAmount = Math.max(0, Number(amount) || 0);
  const rate = numericAmount >= 100 ? 20 : 21;
  const priceRub = Math.round(numericAmount * rate);
  const hasAmount = amount.trim().length > 0 && numericAmount > 0;
  const hasLogin = login.trim().length > 0;

  function validateOrder() {
    return hasAmount && hasLogin ? null : REQUIRED_FIELDS_MESSAGE;
  }

  const message = useMemo(
    () => {
      const serviceName = topupServiceName(productName);
      return normalizeOrderMessage(
        `🛍 Новый заказ\n📦 Сервис: ${serviceName}\n💵 Сумма: ${hasAmount ? `${numericAmount}$` : "не указана"}\n🆔 Steam логин: ${login.trim() || "не указан"}\n💰 К оплате: ${hasAmount ? `${priceRub}р` : "уточнить"}`
      );
    },
    [hasAmount, login, numericAmount, priceRub, productName]
  );

  return (
    <>
      {notice && <OrderNotice message={notice} isVisible={isVisible} />}
      <div className="rounded-2xl border border-white/15 bg-[#0f1420]/90 p-4">
      <div className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-bold text-white/78">Сумма пополнения ($)</span>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            placeholder="Минимум 1$"
            className="rounded-xl border border-white/10 bg-[#07101d] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-sky-300/45"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-bold text-white/78">Steam логин</span>
          <input
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            placeholder="Введите ваш логин"
            className="rounded-xl border border-white/10 bg-[#07101d] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-sky-300/45"
          />
        </label>
      </div>
      <TelegramOrderLink
        message={message}
        productSlug={productSlug}
        offer="steam-topup"
        priceRub={hasAmount ? priceRub : undefined}
        validate={validateOrder}
        onInvalid={showNotice}
        className="mt-4 flex w-full items-center justify-center rounded-xl bg-indigo-500 px-3 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(99,102,241,0.24)] transition-all duration-300 hover:bg-indigo-400 active:scale-95"
      >
        {hasAmount ? `Пополнить за ${formatPriceTag(priceRub)}` : "Пополнить"}
      </TelegramOrderLink>
      </div>
    </>
  );
}

export function EpicTopupForm({ productName, productSlug }: { productName: string; productSlug: string }) {
  const [amount, setAmount] = useState("");
  const { notice, isVisible, showNotice } = useOrderNotice();
  const numericAmount = Math.max(0, Number(amount) || 0);
  const priceRub = Math.round(numericAmount * 21);
  const hasAmount = amount.trim().length > 0 && numericAmount > 0;

  function validateOrder() {
    return hasAmount ? null : REQUIRED_FIELDS_MESSAGE;
  }

  const message = useMemo(
    () => {
      const serviceName = topupServiceName(productName);
      return normalizeOrderMessage(
        `🛍 Новый заказ\n📦 Сервис: ${serviceName}\n💵 Сумма: ${hasAmount ? `${numericAmount}$` : "не указана"}\n💰 К оплате: ${hasAmount ? `${priceRub}р` : "уточнить"}`
      );
    },
    [hasAmount, numericAmount, priceRub, productName]
  );

  return (
    <>
      {notice && <OrderNotice message={notice} isVisible={isVisible} />}
      <div className="rounded-2xl border border-white/15 bg-[#0f1420]/90 p-4">
      <label className="grid gap-2">
        <span className="text-sm font-bold text-white/78">Сумма пополнения ($)</span>
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
          inputMode="decimal"
          placeholder="Минимум 1$"
          className="rounded-xl border border-white/10 bg-[#07101d] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-sky-300/45"
        />
      </label>
      <TelegramOrderLink
        message={message}
        productSlug={productSlug}
        offer="epic-topup"
        priceRub={hasAmount ? priceRub : undefined}
        validate={validateOrder}
        onInvalid={showNotice}
        className="mt-4 flex w-full items-center justify-center rounded-xl bg-indigo-500 px-3 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(99,102,241,0.24)] transition-all duration-300 hover:bg-indigo-400 active:scale-95"
      >
        {hasAmount ? `Пополнить за ${formatPriceTag(priceRub)}` : "Пополнить"}
      </TelegramOrderLink>
      </div>
    </>
  );
}

export function SbpPaymentForm({ productName, productSlug }: { productName: string; productSlug: string }) {
  const [amount, setAmount] = useState("");
  const { notice, isVisible, showNotice } = useOrderNotice();
  const numericAmount = Math.max(0, Number(amount) || 0);
  const hasAmount = amount.trim().length > 0 && numericAmount > 0;
  const pricePmr = Math.round(numericAmount * 0.3);

  function validateOrder() {
    if (!hasAmount) return REQUIRED_FIELDS_MESSAGE;
    if (numericAmount < 100) return "Минимальная сумма пополнения 100₽.";
    return null;
  }

  const message = useMemo(
    () =>
      normalizeOrderMessage(
        `🛍 Новый заказ\n📦 Сервис: ${productName}\n💵 Сумма: ${hasAmount ? `${numericAmount}₽ РФ` : "не указана"}\n💰 К оплате: ${hasAmount ? `${pricePmr}р ПМР` : "уточнить"}`
      ),
    [hasAmount, numericAmount, pricePmr, productName]
  );

  return (
    <>
      {notice && <OrderNotice message={notice} isVisible={isVisible} />}
      <div className="rounded-2xl border border-white/15 bg-[#0f1420]/90 p-4">
        <label className="grid gap-2">
          <span className="text-sm font-bold text-white/78">Сумма пополнения (₽)</span>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            placeholder="Минимум 100₽"
            className="rounded-xl border border-white/10 bg-[#07101d] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-sky-300/45"
          />
        </label>
        <TelegramOrderLink
          message={message}
          productSlug={productSlug}
          offer="sbp-payment"
          priceRub={hasAmount ? pricePmr : undefined}
          validate={validateOrder}
          onInvalid={showNotice}
          className="mt-4 flex w-full items-center justify-center rounded-xl bg-indigo-500 px-3 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(99,102,241,0.24)] transition-all duration-300 hover:bg-indigo-400 active:scale-95"
        >
          {hasAmount ? `Пополнить за ${formatPriceTag(pricePmr)}` : "Пополнить"}
        </TelegramOrderLink>
      </div>
    </>
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
  const { notice, isVisible, showNotice } = useOrderNotice();

  const details = fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.label] = values[field.id] || "";
    return acc;
  }, {});

  function validateDetails() {
    if (fields.some((field) => !(values[field.id] || "").trim())) {
      return REQUIRED_FIELDS_MESSAGE;
    }

    return null;
  }

  return (
    <>
      {notice && <OrderNotice message={notice} isVisible={isVisible} />}
      <div className="grid w-full gap-3">
      {fields.length > 0 && (
        <div className={`grid gap-3 rounded-2xl border border-cyan-300/18 bg-cyan-950/20 p-4 ${fields.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {fields.map((field) => (
            <label key={field.id} className="grid gap-2">
              <span className="text-sm font-bold text-white/78">{field.label}</span>
              <input
                value={values[field.id] || ""}
                onChange={(event) => {
                  const value = field.numeric ? event.target.value.replace(/\D/g, "") : event.target.value;
                  setValues((current) => ({ ...current, [field.id]: value }));
                }}
                inputMode={field.numeric ? "numeric" : undefined}
                pattern={field.numeric ? "[0-9]*" : undefined}
                placeholder={field.placeholder || `Введите ${field.label.toLowerCase()}`}
                className="w-full rounded-xl border border-white/10 bg-[#07101d] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-sky-300/45"
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
                <h3>{compactDividerTitle(offer.title)}</h3>
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
            <OfferIcon icon={offer.icon || offerIcon || fallbackOfferIcon(productSlug, offer.label)} scale={offer.iconScale ?? 1} />
            <div className="offer-copy flex h-12 min-w-0 flex-col justify-center overflow-hidden">
              <p className="offer-title truncate text-sm font-bold leading-none text-white sm:text-base">{offer.label}</p>
              <p className="offer-price font-black text-emerald-300" style={priceTagStyle(offer.priceRub)}>
                {formatPriceTag(offer.priceRub)}
              </p>
            </div>

            <TelegramOrderLink
              message={message}
              productSlug={productSlug}
              offer={offer.label}
              priceRub={offer.priceRub}
              validate={fields.length > 0 ? validateDetails : undefined}
              onInvalid={showNotice}
              className="shrink-0 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(16,185,129,0.22)] transition-all duration-300 hover:bg-emerald-400 active:scale-95"
            >
              Купить
            </TelegramOrderLink>
          </div>
        );
      })}
      </div>
    </>
  );
}

export function MinecraftOrderForm({ productName, productSlug }: { productName: string; productSlug: string }) {
  const [values, setValues] = useState({
    nick: "",
    server: "",
  });
  const { notice, isVisible, showNotice } = useOrderNotice();

  function validateOrder() {
    return values.nick.trim() && values.server.trim() ? null : REQUIRED_FIELDS_MESSAGE;
  }

  const message = normalizeOrderMessage(
    `🛍 Новый заказ\n🎮 Игра: ${productName}\n🆔 Ник: ${values.nick.trim() || "не указан"}\n🌐 Сервер: ${values.server.trim() || "не указан"}`
  );

  return (
    <>
      {notice && <OrderNotice message={notice} isVisible={isVisible} />}
      <div className="grid w-full gap-3 rounded-2xl border border-cyan-300/18 bg-cyan-950/20 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-bold text-white/78">Ник</span>
          <input
            value={values.nick}
            onChange={(event) => setValues((current) => ({ ...current, nick: event.target.value }))}
            placeholder="Введите ник"
            className="rounded-xl border border-white/10 bg-[#07101d] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-sky-300/45"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-bold text-white/78">Сервер</span>
          <input
            value={values.server}
            onChange={(event) => setValues((current) => ({ ...current, server: event.target.value }))}
            placeholder="Введите сервер"
            className="rounded-xl border border-white/10 bg-[#07101d] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-sky-300/45"
          />
        </label>
      </div>
      <TelegramOrderLink
        message={message}
        productSlug={productSlug}
        offer="minecraft-request"
        validate={validateOrder}
        onInvalid={showNotice}
        className="rounded-xl bg-emerald-500 px-3 py-3 text-center text-sm font-bold text-white shadow-[0_10px_24px_rgba(16,185,129,0.22)] transition-all duration-300 hover:bg-emerald-400 active:scale-95"
      >
        Написать менеджеру
      </TelegramOrderLink>
      </div>
    </>
  );
}

export function ManagerLinkForm({ productName, productSlug }: { productName: string; productSlug: string }) {
  const [link, setLink] = useState("");
  const { notice, isVisible, showNotice } = useOrderNotice();
  const message = normalizeOrderMessage(
    `🛍 Новый заказ\n🎁 Сервис: ${productName}\n🔗 Ссылка: ${link.trim() || "не указана"}`
  );

  function validateOrder() {
    return link.trim() ? null : REQUIRED_FIELDS_MESSAGE;
  }

  return (
    <>
      {notice && <OrderNotice message={notice} isVisible={isVisible} />}
      <div className="grid w-full gap-3 rounded-2xl border border-white/15 bg-[#0f1420]/90 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
      <label className="grid min-w-0 gap-2">
        <span className="text-sm font-bold text-white/78">Ссылка:</span>
        <input
          value={link}
          onChange={(event) => setLink(event.target.value)}
          placeholder="Вставьте ссылку"
          className="rounded-xl border border-white/10 bg-[#07101d] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-sky-300/45"
        />
      </label>
      <TelegramOrderLink
        message={message}
        productSlug={productSlug}
        offer="manager-link"
        validate={validateOrder}
        onInvalid={showNotice}
        className="rounded-xl bg-emerald-500 px-3 py-3 text-center text-sm font-bold text-white shadow-[0_10px_24px_rgba(16,185,129,0.22)] transition-all duration-300 hover:bg-emerald-400 active:scale-95"
      >
        Написать менеджеру
      </TelegramOrderLink>
      </div>
    </>
  );
}

export function ManagerButtonForm({ productName, productSlug }: { productName: string; productSlug: string }) {
  const message = normalizeOrderMessage(`🛍 Новый заказ\n📦 Сервис: ${productName}`);

  return (
    <div className="flex w-full justify-center rounded-2xl border border-white/15 bg-[#0f1420]/90 p-4">
      <TelegramOrderLink
        message={message}
        productSlug={productSlug}
        offer="manager-button"
        className="rounded-xl bg-emerald-500 px-3 py-3 text-center text-sm font-bold text-white shadow-[0_10px_24px_rgba(16,185,129,0.22)] transition-all duration-300 hover:bg-emerald-400 active:scale-95"
      >
        Написать менеджеру
      </TelegramOrderLink>
    </div>
  );
}

export function SiteTopupForm({ productName, productSlug }: { productName: string; productSlug: string }) {
  const [link, setLink] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(CURRENCY_RUB);
  const { notice, isVisible, showNotice } = useOrderNotice();
  const numericAmount = Number(amount.replace(",", ".")) || 0;
  const hasLink = link.trim().length > 0;
  const hasAmount = amount.trim().length > 0 && numericAmount > 0;

  function validateOrder() {
    if (!hasLink || !hasAmount) return REQUIRED_FIELDS_MESSAGE;

    const minimum = SITE_TOPUP_MINIMUMS[currency];
    if (minimum && numericAmount < minimum.amount) {
      return `Сумма маленькая. Минимальная сумма пополнения: ${minimum.label}`;
    }

    return null;
  }

  const message = normalizeOrderMessage(
    `🛍 Новый заказ\n📦 Сервис: ${productName}\n🔗 Ссылка: ${link.trim() || "не указана"}\n💵 Сумма пополнения: ${
      hasAmount ? `${amount.trim()} ${currency}` : "не указана"
    }`
  );

  return (
    <>
      {notice && <OrderNotice message={notice} isVisible={isVisible} />}
      <div className="grid w-full gap-4 rounded-2xl border border-cyan-300/18 bg-cyan-950/20 p-4">
        <label className="grid gap-2">
          <span className="text-sm font-bold text-white/78">Ссылка:</span>
          <input
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="Введите ссылку на сайт, который хотите пополнить"
            className="w-full rounded-xl border border-white/10 bg-[#07101d] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-sky-300/45"
          />
        </label>

        <div className="grid gap-2">
          <span className="text-sm font-bold text-white/78">Сумма пополнения</span>
          <div className="grid grid-cols-[minmax(0,1fr)_118px] gap-2">
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^\d.,]/g, ""))}
              inputMode="decimal"
              placeholder="Введите сумму"
              className="w-full rounded-xl border border-white/10 bg-[#07101d] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-sky-300/45"
            />
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#07101d] px-3 py-3 text-sm font-black text-white outline-none transition focus:border-sky-300/45"
            >
              <option value={CURRENCY_RUB}>{CURRENCY_RUB}</option>
              <option value={CURRENCY_PMR}>{CURRENCY_PMR}</option>
              <option value={CURRENCY_USD}>{CURRENCY_USD}</option>
              <option value={CURRENCY_EUR}>{CURRENCY_EUR}</option>
            </select>
          </div>
        </div>

        <TelegramOrderLink
          message={message}
          productSlug={productSlug}
          offer="site-topup"
          validate={validateOrder}
          onInvalid={showNotice}
          className="rounded-xl bg-emerald-500 px-3 py-3 text-center text-sm font-bold text-white shadow-[0_10px_24px_rgba(16,185,129,0.22)] transition-all duration-300 hover:bg-emerald-400 active:scale-95"
        >
          Пополнить
        </TelegramOrderLink>
      </div>
    </>
  );
}
