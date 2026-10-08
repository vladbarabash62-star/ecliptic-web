/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CustomerUser = {
  id: string;
  provider: "google" | "telegram";
  name: string;
  username?: string;
  email?: string;
  avatar?: string;
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

function cleanReferralCode(value: string | null) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32);
}

export default function UserAuthButton() {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  const displayName = useMemo(() => {
    if (!user) return "";
    return user.name || user.username || user.email || "Профиль";
  }, [user]);

  async function refreshUser() {
    const response = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
    if (!response?.ok) return;

    const data = await response.json().catch(() => ({}));
    setUser(data.user || null);
  }

  useEffect(() => {
    void refreshUser();
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = cleanReferralCode(params.get("use") || params.get("ref"));
      const saved = cleanReferralCode(window.localStorage.getItem("ecliptic_referral_code"));
      const nextCode = fromUrl || saved;
      if (fromUrl) window.localStorage.setItem("ecliptic_referral_code", fromUrl);
      if (nextCode) setReferralCode(nextCode);
    } catch {
      setReferralCode("");
    }
    const handleAuthChange = () => void refreshUser();
    window.addEventListener("ecliptic-auth-changed", handleAuthChange);
    return () => window.removeEventListener("ecliptic-auth-changed", handleAuthChange);
  }, []);

  useEffect(() => {
    const openAuth = () => {
      if (user) {
        window.location.href = "/account";
        return;
      }
      setIsOpen(true);
    };
    window.addEventListener("ecliptic-open-auth", openAuth);
    return () => window.removeEventListener("ecliptic-open-auth", openAuth);
  }, [user]);

  async function authorizeTelegram() {
    const webApp = (window as Window & { Telegram?: { WebApp?: AuthTelegramWebApp } }).Telegram?.WebApp;
    const telegramUser = webApp?.initDataUnsafe?.user;

    setIsBusy(true);
    setStatus("Открываю Telegram...");
    try {
      if (!telegramUser?.id) {
        const startResponse = await fetch("/api/auth/telegram/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referralCode }),
        });
        const startData = await startResponse.json().catch(() => ({}));
        if (!startResponse.ok || !startData.url) throw new Error(startData.error || "Не удалось открыть Telegram.");
        window.location.href = startData.url;
        return;
      }

      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: webApp?.initData || "", referralCode, user: telegramUser }),
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

  return (
    <>
      <div className="fixed right-3 top-3 z-50 sm:right-5 sm:top-5">
        {user ? (
          <Link
            href="/account"
            className="flex min-h-11 items-center gap-2 rounded-full border border-sky-300/24 bg-[#07111f]/92 px-3 py-2 text-sm font-black text-white shadow-[0_18px_44px_rgba(14,165,233,0.16)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-sky-300/42 hover:bg-[#0a1728] active:scale-95"
          >
            <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-sky-400 shadow-[0_0_0_1px_rgba(255,255,255,0.18)]">
              <img
                src="/telegram-profile-icon.png"
                alt=""
                className="h-full w-full object-cover"
                width={28}
                height={28}
                draggable={false}
              />
            </span>
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
                onClick={authorizeTelegram}
                disabled={isBusy}
                className="flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-sky-300/28 bg-sky-500/16 text-sm font-black text-sky-50 transition hover:bg-sky-500/22 disabled:opacity-60"
              >
                Войти через Telegram
              </button>
            </div>

            {status ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-sm font-semibold leading-relaxed text-white/72">
                {status}
              </div>
            ) : null}

            <p className="mt-4 text-xs font-semibold leading-relaxed text-white/40">
              После нажатия откроется бот. Нажмите Start, затем кнопку входа в сообщении от бота.
            </p>
          </div>
        </div>
      ) : null}

    </>
  );
}
