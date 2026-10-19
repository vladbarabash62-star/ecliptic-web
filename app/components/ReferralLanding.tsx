"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type ReferrerInfo = {
  name: string;
  username: string;
};

export default function ReferralLanding({ referralCode }: { referralCode: string }) {
  const [referrer, setReferrer] = useState<ReferrerInfo | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/referrals/referrer?code=${encodeURIComponent(referralCode)}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { referrer?: ReferrerInfo | null } | null) => {
        if (active) setReferrer(payload?.referrer || null);
      })
      .catch(() => {
        if (active) setReferrer(null);
      });

    return () => {
      active = false;
    };
  }, [referralCode]);

  function openLogin() {
    try {
      window.localStorage.setItem("ecliptic_referral_code", referralCode);
    } catch {
      // localStorage can be unavailable in some privacy modes.
    }
    try {
      window.dispatchEvent(new CustomEvent("ecliptic-track-analytics", {
        detail: {
          type: "referral_login_click",
          path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
          url: window.location.href,
          referralCode,
        },
      }));
    } catch {
      // Analytics must never block the login button.
    }
    window.dispatchEvent(new Event("ecliptic-open-telegram-auth"));
  }

  return (
    <main className="relative grid min-h-screen w-full place-items-center overflow-hidden bg-transparent px-4 py-24 text-white">
      <section className="w-full max-w-[620px] rounded-3xl border border-white/10 bg-[#090f1b]/90 p-6 text-center shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur-md sm:p-8">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-sky-300/20 bg-sky-500/12">
          <Image src="/loading-icon.png" alt="" width={48} height={48} className="h-12 w-12 object-contain" />
        </div>
        <p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-white/48">Ecliptic Store</p>
        <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
          Вас пригласил
          <span className="mt-2 block text-sky-100">{referrer?.name || "участник магазина"}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-[500px] text-sm font-semibold leading-relaxed text-white/62">
          Авторизуйтесь, чтобы принять приглашение и получить доступ к бонусу.
        </p>
        <button
          type="button"
          onClick={openLogin}
          className="mt-7 min-h-14 w-full rounded-2xl border border-white/80 bg-white px-6 py-4 text-base font-black text-slate-950 shadow-[0_12px_34px_rgba(255,255,255,0.12)] transition hover:bg-sky-50 active:scale-[0.99]"
        >
          Авторизоваться
        </button>
        <Link
          href="/"
          className="mt-3 inline-flex rounded-xl px-4 py-2 text-sm font-bold text-white/48 transition hover:text-white"
        >
          Посмотреть сайт без входа
        </Link>
      </section>
    </main>
  );
}
