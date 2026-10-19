"use client";

export default function AccountLoginPrompt() {
  return (
    <section className="mt-7 rounded-3xl border border-sky-300/20 bg-gradient-to-br from-sky-500/14 to-emerald-500/10 p-6 text-center shadow-[0_18px_55px_rgba(14,165,233,0.1)] sm:p-8">
      <h2 className="text-2xl font-black text-white sm:text-3xl">Авторизуйтесь, чтобы получить бонус</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-relaxed text-white/62">
        Войдите в аккаунт, чтобы открыть реферальную программу и получить доступ к бонусу.
      </p>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("ecliptic-open-telegram-auth"))}
        className="mt-6 w-full rounded-2xl border border-sky-200/30 bg-sky-400 px-6 py-4 text-base font-black text-[#06111f] shadow-[0_14px_34px_rgba(56,189,248,0.24)] transition hover:-translate-y-0.5 hover:bg-sky-300 active:translate-y-0"
      >
        Авторизоваться
      </button>
    </section>
  );
}
