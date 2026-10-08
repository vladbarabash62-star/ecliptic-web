"use client";

import { useEffect, useState } from "react";
import AccountLogoutButton from "./AccountLogoutButton";

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
  referrer?: {
    id: string;
    name: string;
    username?: string;
  } | null;
  lastClaim?: {
    id: string;
    createdAt: string;
    status: "sent" | "pending_manager";
  } | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function tabFromHash(value: string): "orders" | "referral" {
  return value === "#referral" || value === "referral" ? "referral" : "orders";
}

export default function AccountTabs({ orders, referral }: { orders: AccountOrder[]; referral: ReferralInfo | null }) {
  const [tab, setTab] = useState<"orders" | "referral">("orders");
  const [copyText, setCopyText] = useState("Скопировать");
  const [claimText, setClaimText] = useState(referral?.lastClaim ? "Заявка уже отправлена" : "");
  const [isClaiming, setIsClaiming] = useState(false);
  const invitedCount = referral?.invitedCount || 0;
  const canClaimGift = invitedCount >= 5;

  useEffect(() => {
    const syncFromHash = () => setTab(tabFromHash(window.location.hash));
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  function selectTab(nextTab: "orders" | "referral") {
    setTab(nextTab);
    const nextHash = nextTab === "referral" ? "#referral" : "#orders";
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", nextHash);
    }
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
      setClaimText(data.message || "Заявка отправлена менеджеру.");
    } catch (error) {
      setClaimText(error instanceof Error ? error.message : "Не удалось отправить заявку.");
    } finally {
      setIsClaiming(false);
    }
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-1.5">
        <button
          type="button"
          onClick={() => selectTab("orders")}
          className={`rounded-xl px-4 py-2 text-sm font-black transition ${
            tab === "orders" ? "bg-white text-black" : "text-white/62 hover:bg-white/[0.08] hover:text-white"
          }`}
        >
          Личный кабинет
        </button>
        <button
          type="button"
          onClick={() => selectTab("referral")}
          className={`rounded-xl px-4 py-2 text-sm font-black transition ${
            tab === "referral" ? "bg-white text-black" : "text-white/62 hover:bg-white/[0.08] hover:text-white"
          }`}
        >
          Реферальная программа
        </button>
      </div>

      {tab === "orders" ? (
        orders.length ? (
          <div className="mt-7 grid gap-3">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-2xl border border-white/10 bg-[#0f1420]/86 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-lg font-black text-white">{order.productName}</div>
                    <div className="mt-1 text-sm font-semibold text-white/58">{order.offer}</div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-sm font-black text-emerald-200">
                      {Number.isFinite(order.priceRub) ? `${order.priceRub} р` : "Цена уточняется"}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-white/44">{formatDate(order.createdAt)}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.045] p-5 text-sm font-semibold leading-relaxed text-white/62">
            Заказов пока нет. Выберите товар, нажмите “Купить”, и он появится здесь.
          </div>
        )
      ) : (
        <section className="mt-7 grid gap-4">
          <div className="rounded-3xl border border-sky-300/18 bg-gradient-to-br from-sky-500/14 to-emerald-500/10 p-5">
            <div className="text-xs font-black uppercase tracking-[0.12em] text-sky-100/74">Ваша ссылка</div>
            <h2 className="mt-2 text-2xl font-black text-white">Пригласи 5 друзей и получи подарок</h2>
            <p className="mt-2 max-w-[720px] text-sm font-semibold leading-relaxed text-white/62">
              За 5 приглашённых друзей можно получить любой подарок стоимостью до 25 Telegram Stars. Когда условия выполнены,
              здесь появится кнопка для заявки менеджеру.
            </p>
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
              <div className="text-sm font-bold text-white/58">Приглашено друзей</div>
              <div className="mt-1 text-4xl font-black text-white">{invitedCount} / 5</div>
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
            {canClaimGift ? (
              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={claimGift}
                  disabled={isClaiming || Boolean(referral?.lastClaim)}
                  className="rounded-2xl border border-emerald-300/26 bg-emerald-500/14 px-5 py-4 text-center text-sm font-black text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-65"
                >
                  {isClaiming ? "Отправляю..." : referral?.lastClaim ? "Заявка уже отправлена" : "Я выполнил все условия"}
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
            <h2 className="text-lg font-black text-white">Приглашённые друзья</h2>
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
              Кнопка заявки появится после 5 приглашённых друзей.
            </div>
          ) : null}
        </section>
      )}

      <AccountLogoutButton />
    </>
  );
}
