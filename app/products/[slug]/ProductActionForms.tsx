/* eslint-disable @next/next/no-img-element */
"use client";

import type { CSSProperties, FocusEvent, MouseEvent, ReactNode } from "react";
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
  options?: string[];
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

function openTelegramOrderMessage(message: string) {
  const href = sellerChatHref(message);
  const deepHref = sellerChatDeepHref(message);

  playBuyHaptic();
  void copyOrderText(message);
  openSellerChat(href, deepHref);
}

function handleTelegramOrderClick(event: MouseEvent<HTMLAnchorElement>, message: string) {
  event.preventDefault();
  openTelegramOrderMessage(message);
}

function saveCustomerOrder(input: {
  productSlug: string;
  offer: string;
  priceRub?: number;
  message: string;
}) {
  const payload = JSON.stringify(input);

  try {
    if (typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon("/api/orders", blob)) return;
    }
  } catch {
    // If the user is not logged in or Beacon is blocked, the Telegram order still opens.
  }

  fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Order history is a convenience layer; it must not block buying.
  });
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
  confirmation,
  children,
}: {
  message: string;
  productSlug: string;
  offer: string;
  priceRub?: number;
  className: string;
  validate?: () => string | null;
  onInvalid?: (message: string) => void;
  confirmation?: {
    title: string;
    description: string;
    confirmLabel: string;
  };
  children: ReactNode;
}) {
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const href = sellerChatHref(message);

  function completeOrder() {
    saveCustomerOrder({ productSlug, offer, priceRub, message });
    openTelegramOrderMessage(message);
  }

  return (
    <>
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

          if (confirmation) {
            event.preventDefault();
            playBuyHaptic();
            setIsConfirmationOpen(true);
            return;
          }

          saveCustomerOrder({ productSlug, offer, priceRub, message });
          handleTelegramOrderClick(event, message);
        }}
        className={className}
      >
        {children}
      </a>
      <OrderConfirmationDialog
        isOpen={isConfirmationOpen}
        title={confirmation?.title || ""}
        description={confirmation?.description || ""}
        confirmLabel={confirmation?.confirmLabel || "Продолжить"}
        onClose={() => setIsConfirmationOpen(false)}
        onConfirm={() => {
          setIsConfirmationOpen(false);
          completeOrder();
        }}
      />
    </>
  );
}

function OrderConfirmationDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/72 px-4 py-6 backdrop-blur-sm">
      <div className="w-[min(92vw,460px)] rounded-3xl border border-cyan-200/24 bg-[#07101d]/98 p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.7)]">
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200/70">Важное предупреждение</p>
          <h3 className="mt-2 text-2xl font-black leading-tight">{title}</h3>
        </div>
        <p className="text-sm font-semibold leading-relaxed text-white/76">{description}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/14 bg-white/8 px-4 py-3 text-sm font-black text-white/84 transition hover:bg-white/12 active:scale-95"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(16,185,129,0.24)] transition hover:bg-emerald-400 active:scale-95"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
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

function codeValue(value: string) {
  const normalized = value.trim().replace(/`/g, "'");
  return normalized ? `\`${normalized}\`` : "`не указан`";
}

function spotifyPlanAndPeriod(offerLabel: string) {
  const offer = offerLabel.trim();
  const planMatch = offer.match(/(?:^|\s)(premium\s+)?(duo|individual)\b/i);
  if (!planMatch) return { plan: "", period: offer, region: spotifyRegionName("", offer) };

  const planName = planMatch[2].replace(/^./, (letter) => letter.toUpperCase());
  const plan = `Premium ${planName}`;
  const period = offer
    .replace(/premium\s+/i, "")
    .replace(/\b(?:duo|individual)\b/i, "")
    .replace(/\((?:молдова|другой регион|египет|индия)\)/gi, "")
    .replace(/\b(?:молдова|moldova|другой регион|египет|egypt|индия|india)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return { plan, period, region: spotifyRegionName("", offer) };
}

function formatKnownPurchaseMessage(productName: string, offerLabel: string, priceRub: number) {
  const offer = offerLabel.trim();

  if (productName.toLowerCase().includes("spotify")) {
    const { plan, period, region } = spotifyPlanAndPeriod(offer);

    return normalizeOrderMessage(
      `🛍 Новый заказ\n📦 Сервис: ${productName}\n🎧 Тариф: ${plan || offer}\n🌐 Регион: ${region || "уточнить"}\n🗓 Период: ${period || offer}\n💰 К оплате: ${priceRub}р`
    );
  }

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
        .map(([label, value]) => `${label}: ${codeValue(value)}`)
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

function offerDividerTitle(offers: ProductItem[], offerIndex: number) {
  for (let index = offerIndex - 1; index >= 0; index -= 1) {
    const offer = offers[index];
    if (offer.type === "divider") return offer.title;
  }

  return "";
}

function spotifyOfferLabel(productName: string, offerLabel: string, dividerTitle: string) {
  if (!productName.toLowerCase().includes("spotify")) return offerLabel;

  const title = dividerTitle.toLowerCase();
  const plan = title.includes("duo") ? "Duo" : title.includes("individual") ? "Individual" : "";
  const planLabel = plan && !offerLabel.toLowerCase().includes(plan.toLowerCase()) ? `${plan} ${offerLabel}` : offerLabel;
  const region = spotifyRegionName(dividerTitle, offerLabel);
  if (!region || planLabel.toLowerCase().includes(region.toLowerCase())) return planLabel;

  return `${planLabel} (${region})`;
}

function isSpotifyProduct(productName: string) {
  return productName.toLowerCase().includes("spotify");
}

function spotifyRegionKind(dividerTitle: string, offerLabel = "") {
  const text = `${dividerTitle} ${offerLabel}`.toLowerCase();
  if (/(молдов|moldova)/i.test(text)) return "moldova";
  if (/(друг|егип|egypt|инди|india)/i.test(text)) return "other";
  return "";
}

function spotifyRegionName(dividerTitle: string, offerLabel = "") {
  const text = `${dividerTitle} ${offerLabel}`.toLowerCase();
  if (/(молдов|moldova)/i.test(text)) return "Молдова";
  if (/(инди|india)/i.test(text)) return "Индия";
  if (/(егип|egypt|друг)/i.test(text)) return "другой регион";
  return "";
}

function spotifyRegionTooltip(title: string, description?: string) {
  const kind = spotifyRegionKind(title);

  if (kind === "moldova") {
    return "Регион оформления: Молдова. Если вы проживаете в Молдове или ПМР, этот вариант подойдёт лучше всего: регион аккаунта совпадает с регионом подписки, поэтому оформление проходит без дополнительных требований к смене страны или VPN.";
  }

  if (kind === "other") {
    return "Регион оформления: другой регион. Если ваш аккаунт находится не в этом регионе, Spotify может попросить сменить регион или использовать VPN. Выбирая этот вариант, вы берёте региональные риски на себя.";
  }

  return description || "";
}

function spotifyOtherRegionConfirmation() {
  return {
    title: "Spotify Premium для другого региона",
    description:
      "Этот вариант оформляется на регион, отличный от Молдовы. Если ваш Spotify-аккаунт находится в другом регионе, могут понадобиться смена региона или VPN. Перед оформлением убедитесь, что вы согласны с возможными региональными ограничениями Spotify; магазин не отвечает за ограничения, которые Spotify может применить к аккаунту из-за региона.",
    confirmLabel: "Да, оформить",
  };
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
const CURRENCY_PMR = "р ПМР";
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

  return (compactTitles[normalizedTitle] || normalizedTitle)
    .replace(/\bMoldova\b/i, "Молдова")
    .replace(/\s{2,}/g, " ");
}

function RegionInfoBadge({
  title,
  description,
  animationDelay,
}: {
  title: string;
  description?: string;
  animationDelay?: string;
}) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const label = compactDividerTitle(title.replace(/\s*[—-]\s*/g, ": "));

  function showTooltip(event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) {
    if (!description) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      text: description,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  }

  return (
    <div className="category-divider mt-4 first:mt-0" style={{ animationDelay }}>
      <div className="category-divider__line" />
      <button
        type="button"
        onMouseEnter={showTooltip}
        onMouseMove={showTooltip}
        onMouseLeave={() => setTooltip(null)}
        onFocus={showTooltip}
        onBlur={() => setTooltip(null)}
        className="category-divider__content w-full cursor-help transition duration-300 hover:border-cyan-200/40 hover:bg-cyan-950/30 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
      >
        <h3>{label}</h3>
      </button>
      {tooltip && typeof document !== "undefined"
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[99999] w-[min(86vw,390px)] -translate-x-1/2 -translate-y-full rounded-2xl border border-sky-300/35 bg-[#07101d]/98 p-4 text-left text-sm font-semibold leading-relaxed text-white/86 shadow-[0_22px_70px_rgba(0,0,0,0.65)] backdrop-blur"
              style={{ left: tooltip.x, top: Math.max(14, tooltip.y) }}
            >
              {tooltip.text}
            </div>,
            document.body
          )
        : null}
    </div>
  );
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
        `🛍 Новый заказ\n📦 Сервис: ${serviceName}\n💵 Сумма: ${hasAmount ? codeValue(`${numericAmount}$`) : "`не указана`"}\n🆔 Steam логин: ${codeValue(login)}\n💰 К оплате: ${hasAmount ? `${priceRub}р` : "уточнить"}`
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
        `🛍 Новый заказ\n📦 Сервис: ${serviceName}\n💵 Сумма: ${hasAmount ? codeValue(`${numericAmount}$`) : "`не указана`"}\n💰 К оплате: ${hasAmount ? `${priceRub}р` : "уточнить"}`
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
        `🛍 Новый заказ\n📦 Сервис: ${productName}\n💵 Сумма: ${hasAmount ? codeValue(`${numericAmount}₽ РФ`) : "`не указана`"}\n💰 К оплате: ${hasAmount ? `${pricePmr}р ПМР` : "уточнить"}`
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
              {field.options?.length ? (
                <select
                  value={values[field.id] || ""}
                  onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-[#07101d] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-sky-300/45"
                >
                  <option value="">{field.placeholder || `Выберите ${field.label.toLowerCase()}`}</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
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
              )}
            </label>
          ))}
        </div>
      )}

      {offers.map((offer, index) => {
        if (offer.type === "divider") {
          const isSpotifyDivider = isSpotifyProduct(productName);
          if (isSpotifyDivider || /^Регион\b/i.test(offer.title)) {
            return (
              <RegionInfoBadge
                key={`${offer.title}-${index}`}
                title={offer.title}
                description={isSpotifyDivider ? spotifyRegionTooltip(offer.title, offer.description) : offer.description}
                animationDelay={`${140 + index * 55}ms`}
              />
            );
          }

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

        const dividerTitle = offerDividerTitle(offers, index);
        const telegramOfferLabel = spotifyOfferLabel(productName, offer.label, dividerTitle);
        const message = formatPurchaseMessage(
          productName,
          telegramOfferLabel,
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
              offer={telegramOfferLabel}
              priceRub={offer.priceRub}
              validate={fields.length > 0 ? validateDetails : undefined}
              onInvalid={showNotice}
              confirmation={
                isSpotifyProduct(productName) && spotifyRegionKind(dividerTitle, offer.label) === "other"
                  ? spotifyOtherRegionConfirmation()
                  : undefined
              }
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
    `🛍 Новый заказ\n🎮 Игра: ${productName}\n🆔 Ник: ${codeValue(values.nick)}\n🌐 Сервер: ${codeValue(values.server)}`
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
    `🛍 Новый заказ\n🎁 Сервис: ${productName}\n🔗 Ссылка: ${codeValue(link)}`
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
    `🛍 Новый заказ\n📦 Сервис: ${productName}\n🔗 Ссылка: ${codeValue(link)}\n💵 Сумма пополнения: ${
      hasAmount ? codeValue(`${amount.trim()} ${currency}`) : "`не указана`"
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
