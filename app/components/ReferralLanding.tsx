"use client";

import Image from "next/image";
import Link from "next/link";

export default function ReferralLanding({ referralCode }: { referralCode: string }) {
  function openLogin() {
    try {
      window.localStorage.setItem("ecliptic_referral_code", referralCode);
    } catch {
      // localStorage can be unavailable in some privacy modes.
    }
    window.dispatchEvent(new Event("ecliptic-open-auth"));
  }

  return (
    <main className="relative grid min-h-screen w-full place-items-center overflow-hidden bg-transparent px-4 py-24 text-white">
      <section className="w-full max-w-[620px] rounded-3xl border border-white/10 bg-[#090f1b]/90 p-6 text-center shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur-md sm:p-8">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-sky-300/20 bg-sky-500/12">
          <Image src="/loading-icon.png" alt="" width={48} height={48} className="h-12 w-12 object-contain" />
        </div>
        <h1 className="mt-5 text-4xl font-black sm:text-5xl">Ecliptic Store</h1>
        <p className="mx-auto mt-3 max-w-[500px] text-sm font-semibold leading-relaxed text-white/62">
          Вас пригласили в Ecliptic Store. Войдите через Telegram, чтобы приглашение закрепилось за аккаунтом,
          а дальше можно будет смотреть товары, заказы и реферальную программу в личном кабинете.
        </p>
        <button
          type="button"
          onClick={openLogin}
          className="mt-7 min-h-12 w-full rounded-2xl border border-sky-300/28 bg-sky-500/16 px-5 py-3 text-sm font-black text-sky-50 transition hover:bg-sky-500/22 active:scale-[0.99]"
        >
          Войти в аккаунт
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
