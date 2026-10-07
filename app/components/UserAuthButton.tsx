/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type CustomerUser = {
  id: string;
  provider: "google" | "telegram";
  name: string;
  username?: string;
  email?: string;
  avatar?: string;
};

type GoogleAccounts = {
  accounts?: {
    id?: {
      initialize: (options: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
      }) => void;
      prompt: () => void;
    };
  };
};

type AuthTelegramWebApp = {
  initData?: string;
  initDataUnsafe?: {
    user?: {
      id?: number;
      username?: string;
      first_name?: string;
      last_name?: string;
      photo_url?: string;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const TELEGRAM_LOGIN_BOT =
  process.env.NEXT_PUBLIC_TELEGRAM_LOGIN_BOT_USERNAME ||
  process.env.NEXT_PUBLIC_TELEGRAM_WEBAPP_BOT_USERNAME ||
  "Ecliptic_Store_BOT";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "ES";
}

function loadScript(src: string, id: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "true") resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Script load failed")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("Script load failed"));
    document.head.appendChild(script);
  });
}

export default function UserAuthButton() {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const telegramWidgetRef = useRef<HTMLDivElement | null>(null);

  const displayName = useMemo(() => {
    if (!user) return "";
    return user.username || user.name || user.email || "Профиль";
  }, [user]);

  async function refreshUser() {
    const response = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
    if (!response?.ok) return;

    const data = await response.json().catch(() => ({}));
    setUser(data.user || null);
  }

  useEffect(() => {
    void refreshUser();
    const handleAuthChange = () => void refreshUser();
    window.addEventListener("ecliptic-auth-changed", handleAuthChange);
    return () => window.removeEventListener("ecliptic-auth-changed", handleAuthChange);
  }, []);

  useEffect(() => {
    if (!isOpen || !telegramWidgetRef.current || user) return;

    const container = telegramWidgetRef.current;
    container.innerHTML = "";
    const bot = TELEGRAM_LOGIN_BOT.replace(/^@/, "").trim();
    if (!/^[a-zA-Z0-9_]{5,32}$/.test(bot)) {
      setStatus("Telegram бот для входа не настроен.");
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", bot);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "14");
    script.setAttribute("data-userpic", "true");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-auth-url", `${window.location.origin}/api/auth/telegram/callback?returnTo=/account`);
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [isOpen, user]);

  async function authorizeGoogle() {
    if (!GOOGLE_CLIENT_ID) {
      setStatus("Google вход почти готов. Нужно добавить NEXT_PUBLIC_GOOGLE_CLIENT_ID в Vercel.");
      return;
    }

    setIsBusy(true);
    setStatus("Открываю Google...");
    try {
      await loadScript("https://accounts.google.com/gsi/client", "google-identity-services");
      window.google?.accounts?.id?.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          if (!response.credential) {
            setStatus("Google не передал данные входа.");
            setIsBusy(false);
            return;
          }

          const authResponse = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: response.credential }),
          });
          const data = await authResponse.json().catch(() => ({}));
          if (!authResponse.ok) throw new Error(data.error || "Google вход не прошёл.");
          setUser(data.user);
          setIsOpen(false);
          setStatus("");
          window.dispatchEvent(new Event("ecliptic-auth-changed"));
          setIsBusy(false);
        },
      });
      window.google?.accounts?.id?.prompt();
      setStatus("Подтвердите вход в окне Google.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Google вход не прошёл.");
      setIsBusy(false);
    }
  }

  async function authorizeTelegram() {
    const webApp = (window as Window & { Telegram?: { WebApp?: AuthTelegramWebApp } }).Telegram?.WebApp;
    const telegramUser = webApp?.initDataUnsafe?.user;
    if (!telegramUser?.id) {
      setStatus("Нажмите синюю кнопку Telegram ниже. Если она не появилась, проверьте блокировку скриптов.");
      return;
    }

    setIsBusy(true);
    setStatus("Вхожу через Telegram...");
    try {
      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: webApp?.initData || "", user: telegramUser }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Telegram вход не прошёл.");

      setUser(data.user);
      setIsOpen(false);
      setStatus("");
      window.dispatchEvent(new Event("ecliptic-auth-changed"));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Telegram вход не прошёл.");
    } finally {
      setIsBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    setUser(null);
    setIsOpen(false);
    window.dispatchEvent(new Event("ecliptic-auth-changed"));
  }

  return (
    <>
      <div className="fixed right-3 top-3 z-50 sm:right-5 sm:top-5">
        {user ? (
          <Link
            href="/account"
            className="flex min-h-11 items-center gap-2 rounded-full border border-sky-300/24 bg-[#07111f]/92 px-3 py-2 text-sm font-black text-white shadow-[0_18px_44px_rgba(14,165,233,0.16)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-sky-300/42 hover:bg-[#0a1728] active:scale-95"
          >
            {user.avatar ? (
              <img src={user.avatar} alt="" className="h-7 w-7 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="grid h-7 w-7 place-items-center rounded-full bg-sky-400/20 text-[11px] text-sky-100">
                {initials(displayName)}
              </span>
            )}
            <span className="hidden max-w-[150px] truncate sm:block">{displayName}</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="min-h-11 rounded-full border border-white/12 bg-[#07111f]/92 px-4 py-2 text-sm font-black text-white shadow-[0_18px_44px_rgba(14,165,233,0.16)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-sky-300/38 hover:bg-[#0a1728] active:scale-95"
          >
            Авторизоваться
          </button>
        )}
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/64 px-4 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div
            className="w-full max-w-[420px] rounded-3xl border border-white/12 bg-[#080f1d]/96 p-5 text-white shadow-[0_26px_90px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Вход в Ecliptic Store</h2>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-white/58">
                  Кабинет сохранит ваши заказы и останется доступен на этом устройстве.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-lg font-black text-white/75 hover:bg-white/10"
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={authorizeGoogle}
                disabled={isBusy}
                className="flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-white/12 bg-white text-sm font-black text-black transition hover:bg-white/90 disabled:opacity-60"
              >
                Войти через Google
              </button>
              <div className="grid min-h-12 place-items-center rounded-2xl border border-sky-300/28 bg-sky-500/10 px-3 py-2">
                <div ref={telegramWidgetRef} className="telegram-login-widget min-h-10" />
                <button
                  type="button"
                  onClick={authorizeTelegram}
                  disabled={isBusy}
                  className="mt-2 text-xs font-bold text-sky-100/72 transition hover:text-sky-50 disabled:opacity-60"
                >
                  Войти через Telegram Mini App
                </button>
              </div>
            </div>

            {status ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-sm font-semibold leading-relaxed text-white/72">
                {status}
              </div>
            ) : null}

            <p className="mt-4 text-xs font-semibold leading-relaxed text-white/40">
              Вход нужен только для кабинета и списка заказов. Админка от этого не меняется.
            </p>
          </div>
        </div>
      ) : null}

      {user ? (
        <button
          type="button"
          onClick={logout}
          className="fixed right-3 top-[62px] z-40 hidden rounded-full border border-white/10 bg-black/42 px-3 py-1.5 text-xs font-bold text-white/45 backdrop-blur-md transition hover:text-white sm:right-5 sm:block"
        >
          Выйти
        </button>
      ) : null}
    </>
  );
}
