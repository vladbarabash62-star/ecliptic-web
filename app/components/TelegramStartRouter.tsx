"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

type TelegramBridgeWindow = Window & {
  Telegram?: {
    WebApp?: {
      initDataUnsafe?: {
        start_param?: string;
      };
    };
  };
};

const START_PARAM_KEYS = ["tgWebAppStartParam", "startapp", "start_param"];

function normalizeProductSlug(value: string | null | undefined) {
  const slug = (value || "").trim().toLowerCase();
  return /^[a-z0-9-]{1,80}$/.test(slug) ? slug : "";
}

function readStartParamFromParams(params: URLSearchParams) {
  for (const key of START_PARAM_KEYS) {
    const slug = normalizeProductSlug(params.get(key));
    if (slug) return slug;
  }

  const webAppData = params.get("tgWebAppData");
  if (webAppData) {
    try {
      return readStartParamFromParams(new URLSearchParams(webAppData));
    } catch {
      return "";
    }
  }

  return "";
}

function readTelegramStartParam() {
  const bridgeSlug = normalizeProductSlug(
    (window as TelegramBridgeWindow).Telegram?.WebApp?.initDataUnsafe?.start_param
  );
  if (bridgeSlug) return bridgeSlug;

  const querySlug = readStartParamFromParams(new URLSearchParams(window.location.search));
  if (querySlug) return querySlug;

  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return "";

  try {
    return readStartParamFromParams(new URLSearchParams(hash));
  } catch {
    return "";
  }
}

export default function TelegramStartRouter() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];

    const routeToStartProduct = () => {
      if (cancelled) return;

      const slug = readTelegramStartParam();
      if (!slug || pathname === `/products/${slug}`) return;

      router.replace(`/products/${slug}?app=1`);
    };

    routeToStartProduct();
    for (const delay of [120, 360, 900, 1600]) {
      timers.push(window.setTimeout(routeToStartProduct, delay));
    }

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [pathname, router]);

  return null;
}
