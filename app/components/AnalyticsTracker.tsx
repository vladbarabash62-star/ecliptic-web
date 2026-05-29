"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { playButtonHaptic, playBuyHaptic, playFieldHaptic, playLaunchHaptic, playProductHaptic } from "./haptics";

type AnalyticsEvent = {
  type: string;
  path: string;
  product?: string;
  offer?: string;
  time: string;
  visitorId?: string;
  sessionId?: string;
  referrer?: string;
  language?: string;
  timezone?: string;
  screen?: string;
  telegramUser?: {
    id?: number;
    username?: string;
    firstName?: string;
  };
};

const STORAGE_KEY = "ecliptic_analytics_events";
const VISITOR_KEY = "ecliptic_visitor_id";
const SESSION_KEY = "ecliptic_session_id";
const RECOVERY_KEY = "ecliptic_recovered_runtime_error";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready?: () => void;
        expand?: () => void;
        HapticFeedback?: {
          impactOccurred?: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
          selectionChanged?: () => void;
        };
        initDataUnsafe?: {
          user?: {
            id?: number;
            username?: string;
            first_name?: string;
          };
        };
      };
    };
  }
}

function readEvents(): AnalyticsEvent[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeEvent(event: AnalyticsEvent) {
  try {
    const events = readEvents();
    events.push(event);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-700)));
  } catch {
    // Analytics must never break the storefront.
  }
}

function trackEvent(event: AnalyticsEvent) {
  writeEvent(event);

  fetch("/api/analytics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
    keepalive: true,
  }).catch(() => {
    // Local storage remains as a fallback if the network is unavailable.
  });
}

function getOrCreateId(key: string) {
  let value = "";

  try {
    value = sessionStorage.getItem(key) || localStorage.getItem(key) || "";
  } catch {
    value = "";
  }

  if (!value) {
    value =
      typeof globalThis.crypto?.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

    try {
      if (key === SESSION_KEY) {
        sessionStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, value);
      }
    } catch {
      // Private/locked storage is fine; keep the in-memory value for this event.
    }
  }

  return value;
}

function enrichEvent(event: Omit<AnalyticsEvent, "visitorId" | "sessionId">) {
  let timezone: string | undefined;

  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    timezone = undefined;
  }

  return {
    ...event,
    visitorId: getOrCreateId(VISITOR_KEY),
    sessionId: getOrCreateId(SESSION_KEY),
    referrer: document.referrer || undefined,
    language: navigator.language,
    timezone,
    screen: window.screen ? `${window.screen.width}x${window.screen.height}` : undefined,
  };
}

function getTelegramUser() {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (!user) return undefined;

  return {
    id: user.id,
    username: user.username,
    firstName: user.first_name,
  };
}

function playClickHaptic(target: HTMLElement) {
  const hasDirectHaptic = target.closest("[data-haptic-direct='true']");
  const isBuyClick = target.closest("[data-analytics='buy_click']");
  const isProductClick = target.closest("[data-analytics='product_open']");
  const isField = target.closest("input, textarea, select");

  if (hasDirectHaptic) return;

  try {
    if (isField) {
      playFieldHaptic();
      return;
    }

    if (isBuyClick) {
      playBuyHaptic();
      return;
    }

    if (isProductClick) {
      playProductHaptic();
      return;
    }

    playButtonHaptic();
  } catch {
    // Haptics should never block the tap.
  }
}

function isEditableTarget(target: EventTarget | null) {
  const element = target instanceof HTMLElement ? target : null;
  if (!element) return false;

  return Boolean(
    element.closest("input, textarea, select, [contenteditable='true']")
  );
}

function shouldLoadTelegramScript() {
  if (window.Telegram?.WebApp) return false;

  const source = `${window.location.search} ${window.location.hash} ${navigator.userAgent}`.toLowerCase();
  return source.includes("telegram") || source.includes("tgwebapp") || new URLSearchParams(window.location.search).get("app") === "1";
}

function loadTelegramScript() {
  return new Promise<void>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-telegram-webapp]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => resolve(), { once: true });
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    script.dataset.telegramWebapp = "true";
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

function recoverFromRuntimeLoadError(error: unknown) {
  const text =
    error instanceof Error
      ? `${error.name} ${error.message} ${error.stack || ""}`
      : String(error || "");

  if (!/ChunkLoadError|Loading chunk|dynamically imported module|Minified React error #418|Hydration failed|server rendered HTML/i.test(text)) {
    return;
  }

  try {
    if (sessionStorage.getItem(RECOVERY_KEY) === "1") return;
    sessionStorage.setItem(RECOVERY_KEY, "1");
  } catch {
    // If storage is blocked, still try a single plain reload.
  }

  const url = new URL(window.location.href);
  url.searchParams.set("_fresh", Date.now().toString(36));
  window.location.replace(url.toString());
}

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    const activateTelegram = () => {
      if (cancelled) return;

      try {
        window.Telegram?.WebApp?.ready?.();
        window.Telegram?.WebApp?.expand?.();
      } catch {
        // Telegram bridge is optional outside Telegram.
      }

      document.documentElement.classList.toggle(
        "is-telegram-webapp",
        Boolean(window.Telegram?.WebApp)
      );
    };

    if (shouldLoadTelegramScript()) {
      loadTelegramScript().then(activateTelegram);
    } else {
      activateTelegram();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;

    const play = () => {
      window.setTimeout(playLaunchHaptic, 220);
    };
    const timer = window.setTimeout(playLaunchHaptic, 520);
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) play();
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [pathname]);

  useEffect(() => {
    try {
      trackEvent(enrichEvent({
        type: "page_view",
        path: pathname,
        time: new Date().toISOString(),
        telegramUser: getTelegramUser(),
      }));
    } catch {
      // Page view tracking is best-effort.
    }
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const element = target?.closest<HTMLElement>("[data-analytics]");
      if (!element) return;

      try {
        trackEvent(enrichEvent({
          type: element.dataset.analytics || "click",
          path: window.location.pathname,
          product: element.dataset.product,
          offer: element.dataset.offer,
          time: new Date().toISOString(),
          telegramUser: getTelegramUser(),
        }));
      } catch {
        // Click tracking is best-effort.
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    const handleInteractiveClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const interactive = target?.closest<HTMLElement>("a, button, input, textarea, select, [role='button']");
      if (!interactive) return;

      playClickHaptic(interactive);
    };

    document.addEventListener("click", handleInteractiveClick);
    return () => document.removeEventListener("click", handleInteractiveClick);
  }, []);

  useEffect(() => {
    const blockCopy = (event: ClipboardEvent) => {
      if (!isEditableTarget(event.target)) event.preventDefault();
    };
    const blockSelect = (event: Event) => {
      if (!isEditableTarget(event.target)) event.preventDefault();
    };
    const blockContextMenu = (event: MouseEvent) => {
      if (!isEditableTarget(event.target)) event.preventDefault();
    };

    document.addEventListener("copy", blockCopy);
    document.addEventListener("cut", blockCopy);
    document.addEventListener("selectstart", blockSelect);
    document.addEventListener("contextmenu", blockContextMenu);

    return () => {
      document.removeEventListener("copy", blockCopy);
      document.removeEventListener("cut", blockCopy);
      document.removeEventListener("selectstart", blockSelect);
      document.removeEventListener("contextmenu", blockContextMenu);
    };
  }, []);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => recoverFromRuntimeLoadError(event.error || event.message);
    const handleRejection = (event: PromiseRejectionEvent) => recoverFromRuntimeLoadError(event.reason);

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
