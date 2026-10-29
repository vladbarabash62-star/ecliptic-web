"use client";

import { useEffect, useState } from "react";

type AccountOrder = {
  id: string;
  createdAt: string;
  productName: string;
  offer: string;
  priceRub?: number;
};

type InvitedFriend = {
  id: string;
  name: string;
  username?: string;
  joinedAt: string;
};

type ReferralInfo = {
  code: string;
  link: string;
  invited: InvitedFriend[];
  invitedCount: number;
  orderCount: number;
  hasPurchase: boolean;
  referrer?: {
    id: string;
    name: string;
    username?: string;
  } | null;
  lastClaim?: {
    id: string;
    createdAt: string;
    status: "sent" | "pending_manager" | "rewarded" | "canceled";
    rewardedAt?: string;
  } | null;
  rewardClaim?: {
    id: string;
    createdAt: string;
    status: "sent" | "pending_manager" | "rewarded" | "canceled";
    rewardedAt?: string;
  } | null;
};

const REFERRAL_CLAIM_COOLDOWN_MS = 30 * 60 * 1000;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата не указана";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatClaimWait(ms: number) {
  const totalSeconds = Math.max(1, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds} сек.`;
  if (seconds <= 0) return `${minutes} мин.`;
  return `${minutes} мин. ${seconds} сек.`;
}

type AccountTab = "orders" | "referral";

function tabFromHash(value: string): AccountTab {
  if (value === "#referral" || value === "referral") return "referral";
  if (value === "#orders" || value === "orders") return "orders";
  return "referral";
}

export default function AccountTabs({ orders, referral: initialReferral }: { orders: AccountOrder[]; referral: ReferralInfo | null }) {
  const [tab, setTab] = useState<AccountTab>("referral");
  const [referral, setReferral] = useState<ReferralInfo | null>(initialReferral);
  const [copyText, setCopyText] = useState("Скопировать");
  const [claimText, setClaimText] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [lastClaimAt, setLastClaimAt] = useState(referral?.lastClaim?.status === "canceled" ? "" : referral?.lastClaim?.createdAt || "");
  const [now, setNow] = useState(() => Date.now());
  const invitedCount = referral?.invitedCount || 0;
  const orderCount = referral?.orderCount || 0;
  const canClaimGift = invitedCount >= 5 && orderCount > 0;
  const rewardReceived = Boolean(referral?.rewardClaim || referral?.lastClaim?.status === "rewarded");
  const claimCooldownMs = lastClaimAt
    ? Math.max(0, REFERRAL_CLAIM_COOLDOWN_MS - (now - new Date(lastClaimAt).getTime()))
    : 0;
  const canSubmitClaim = canClaimGift && !rewardReceived && claimCooldownMs <= 0;

  useEffect(() => {
    const syncFromHash = () => setTab(tabFromHash(window.location.hash));
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  useEffect(() => {
    if (tab !== "referral") return;
    let active = true;
    const refreshReferral = async () => {
      const response = await fetch("/api/referrals/status", { cache: "no-store" }).catch(() => null);
      if (!response?.ok) return;
      const data = await response.json().catch(() => ({}));
      if (active && data?.referral) {
        setReferral(data.referral);
        setLastClaimAt(data.referral.lastClaim?.status === "canceled" ? "" : data.referral.lastClaim?.createdAt || "");
      }
    };
    void refreshReferral();
    const interval = window.setInterval(() => void refreshReferral(), 10000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [tab]);

  useEffect(() => {
    if (!canClaimGift || !lastClaimAt) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [canClaimGift, lastClaimAt]);

  function selectTab(nextTab: AccountTab) {
    setTab(nextTab);
    const nextHash = nextTab === "referral" ? "#referral" : "#orders";
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", nextHash);
    }
  }

  async function confirmLogout() {
    setIsLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    window.dispatchEvent(new Event("ecliptic-auth-changed"));
    window.location.href = "/";
  }

  async function copyReferralLink() {
    if (!referral?.link) return;
    await navigator.clipboard?.writeText(referral.link).catch(() => undefined);
    setCopyText("Скопировано");
    window.setTimeout(() => setCopyText("Скопировать"), 1400);
  }

  async function claimGift() {
    setIsClaiming(true);
    setClaimText("Отправляю заявку...");
    try {
      const response = await fetch("/api/referrals/claim", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || "Не удалось отправить заявку.");
      if (data.claim?.createdAt) setLastClaimAt(data.claim.createdAt);
      const refreshed = await fetch("/api/referrals/status", { cache: "no-store" }).catch(() => null);
      if (refreshed?.ok) {
        const refreshedData = await refreshed.json().catch(() => ({}));
        if (refreshedData?.referral) {
          setReferral(refreshedData.referral);
          setLastClaimAt(refreshedData.referral.lastClaim?.status === "canceled" ? "" : refreshedData.referral.lastClaim?.createdAt || data.claim?.createdAt || "");
        }
      }
      setNow(Date.now());
      setClaimText(data.message || "Заявка отправлена менеджеру.");
    } catch (error) {
      setClaimText(error instanceof Error ? error.message : "Не удалось отправить заявку.");
      setNow(Date.now());
    } finally {
      setIsClaiming(false);
    }
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-1.5">
        <button
          type="button"
          onClick={() => selectTab("referral")}
          className={`rounded-xl px-4 py-2 text-sm font-black transition ${
            tab === "referral" ? "bg-white text-black" : "text-white/62 hover:bg-white/[0.08] hover:text-white"
          }`}
        >
          Реферальная программа
        </button>
        <button
          type="button"
          onClick={() => selectTab("orders")}
          className={`rounded-xl px-4 py-2 text-sm font-black transition ${
            tab === "orders" ? "bg-white text-black" : "text-white/62 hover:bg-white/[0.08] hover:text-white"
          }`}
        >
          Мои заказы
        </button>
      </div>

      <div className="mt-7 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-white sm:text-3xl">Ecliptic Store</h1>
        <button
          type="button"
          onClick={() => setIsLogoutOpen(true)}
          aria-label="Выйти из аккаунта"
          title="Выйти из аккаунта"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-3 text-sm font-black text-white/82 transition hover:border-red-300/40 hover:bg-red-500/14 hover:text-red-100 active:scale-95"
        >
          <span aria-hidden="true" className="text-lg leading-none">↪</span>
          <span>Выйти из аккаунта</span>
        </button>
      </div>

      {tab === "orders" ? (
        orders.length ? (
          <section className="mt-7 grid gap-3">
            <h2 className="text-xl font-black text-white">Мои заказы</h2>
            {orders.map((order) => {
              const rawOffer = typeof order.offer === "string" ? order.offer.trim() : "";
              const visibleOffer = ["manager-button", "manager-link"].includes(rawOffer) ? "" : rawOffer;

              return (
                <article
                  key={order.id}
                  className="rounded-2xl border border-white/10 bg-[#0f1420]/86 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-lg font-black text-white">{order.productName}</div>
                      {visibleOffer ? <div className="mt-1 text-sm font-semibold text-white/58">{visibleOffer}</div> : null}
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="mt-1 text-xs font-semibold text-white/44">{formatDate(order.createdAt)}</div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.045] p-5 text-sm font-semibold leading-relaxed text-white/62">
            Заказов пока нет. Выберите товар, нажмите “Купить”, и он появится здесь.
          </div>
        )
      ) : (
        <section className="mt-7 grid gap-4">
          <div className="rounded-3xl border border-sky-300/18 bg-gradient-to-br from-sky-500/14 to-emerald-500/10 p-5">
            <h2 className="text-2xl font-black leading-tight text-white sm:text-3xl">
              Пригласи 5 друзей, соверши любую покупку в магазине и получи подарок стоимостью 50 Telegram Stars
            </h2>
            <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm font-black text-sky-50">
                <span className="block truncate">{referral?.link || "Ссылка появится после входа"}</span>
              </div>
              <button
                type="button"
                onClick={copyReferralLink}
                disabled={!referral?.link}
                className="rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {copyText}
              </button>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.055] p-4">
              <div className="text-sm font-bold text-white/58">Приглашено участников</div>
              <div className="mt-1 text-4xl font-black text-white">{invitedCount} / 5</div>
            </div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-sm font-bold text-white/68">
              Покупок: <span className="text-white">{orderCount}</span> · для подарка нужен хотя бы один заказ
            </div>
            <div className="mt-4 rounded-2xl border border-sky-300/18 bg-sky-500/10 p-4 text-left">
              <div className="text-xs font-black uppercase tracking-[0.1em] text-sky-100/60">Кто пригласил вас</div>
              <div className="mt-2 text-base font-black text-white">
                {referral?.referrer ? referral.referrer.name : "Вы зарегистрировались без приглашения"}
              </div>
              {referral?.referrer?.username ? (
                <div className="mt-1 text-sm font-bold text-sky-100/72">{referral.referrer.username}</div>
              ) : null}
            </div>
            {rewardReceived ? (
              <div className="mt-4 rounded-2xl border border-emerald-300/22 bg-emerald-500/12 p-4 text-center text-sm font-black text-emerald-100">
                Подарок уже отправлен.
              </div>
            ) : canClaimGift ? (
              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={claimGift}
                  disabled={isClaiming || !canSubmitClaim}
                  className="rounded-2xl border border-emerald-300/26 bg-emerald-500/14 px-5 py-4 text-center text-sm font-black text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-65"
                >
                  {isClaiming
                    ? "Отправляю..."
                    : claimCooldownMs > 0
                      ? `Повторно через ${formatClaimWait(claimCooldownMs)}`
                      : "Я выполнил все условия"}
                </button>
                {claimText ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-sm font-semibold leading-relaxed text-white/68">
                    {claimText}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <h2 className="text-lg font-black text-white">Приглашённые участники</h2>
            <div className="mt-4 grid gap-2">
              {referral?.invited.length ? (
                referral.invited.map((friend) => (
                  <div key={friend.id} className="rounded-2xl border border-white/10 bg-[#0f1420]/80 p-4">
                    <div className="font-black text-white">Имя: {friend.name || "не указано"}</div>
                    <div className="mt-1 text-sm font-bold text-sky-100/78">
                      Telegram: {friend.username || "username не указан"}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-white/48">
                      Зарегистрировался по ссылке: {formatDate(friend.joinedAt)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm font-semibold text-white/58">
                  Пока никто не зарегистрировался по вашей ссылке.
                </div>
              )}
            </div>
          </div>

          {!canClaimGift ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4 text-center text-sm font-bold text-white/48">
              Кнопка заявки появится после 5 приглашённых участников и первой покупки.
            </div>
          ) : null}
        </section>
      )}

      {isLogoutOpen ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="w-full max-w-sm rounded-3xl border border-white/12 bg-[#0b111d] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
          >
            <h2 id="logout-title" className="text-xl font-black text-white">Выйти из аккаунта?</h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-white/60">Вы уверены, что хотите завершить сеанс?</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsLogoutOpen(false)}
                disabled={isLoggingOut}
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white transition hover:bg-white/[0.1] disabled:opacity-60"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                disabled={isLoggingOut}
                className="rounded-2xl border border-red-300/25 bg-red-500/14 px-4 py-3 text-sm font-black text-red-100 transition hover:bg-red-500/22 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? "Выходим..." : "Выйти"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
