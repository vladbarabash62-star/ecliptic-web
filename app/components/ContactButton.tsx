"use client";

import Image from "next/image";
import type { MouseEvent } from "react";
import { playButtonHaptic } from "./haptics";

const TELEGRAM_USERNAME = "Ecliptic_Store_PMR";
const QUESTION_MESSAGE = "Здравствуйте, хочу задать вопрос по Ecliptic Store.";

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

function isMobileTelegramTarget() {
  return /android|iphone|ipad|ipod|mobile|windows phone/i.test(navigator.userAgent);
}

async function copyQuestionText() {
  try {
    await navigator.clipboard?.writeText(QUESTION_MESSAGE);
    return;
  } catch {
    // Some mobile WebViews block clipboard. The chat still opens below.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = QUESTION_MESSAGE;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  } catch {
    // Opening Telegram is more important than blocking the tap.
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

function handleContactClick(event: MouseEvent<HTMLAnchorElement>) {
  const href = sellerChatHref(QUESTION_MESSAGE);
  const deepHref = sellerChatDeepHref(QUESTION_MESSAGE);

  event.preventDefault();
  playButtonHaptic();
  void copyQuestionText();
  openSellerChat(href, deepHref);
}

export default function ContactButton() {
  const href = sellerChatHref(QUESTION_MESSAGE);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-analytics="telegram_contact"
      data-haptic-direct="true"
      onClick={handleContactClick}
      className="contact-float fixed bottom-5 right-4 z-50 flex items-center gap-3 rounded-full border border-sky-300/20 bg-[#07111f]/92 px-5 py-3 text-sm font-bold text-white shadow-[0_0_0_1px_rgba(56,189,248,0.08),0_18px_46px_rgba(14,165,233,0.18)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-sky-300/35 hover:bg-[#0a1728] active:scale-95 sm:bottom-7 sm:right-7 sm:px-6 sm:py-4 sm:text-base"
    >
      <Image
        src="/telegram-icon.svg"
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 rounded-full shadow-[0_8px_22px_rgba(56,189,248,0.35)]"
      />
      <span>Задать вопрос</span>
    </a>
  );
}
