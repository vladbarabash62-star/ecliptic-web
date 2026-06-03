"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-transparent px-4 text-white">
      <div className="w-full max-w-[420px] rounded-3xl border border-white/10 bg-[#0a0d14]/90 p-6 text-center shadow-[0_24px_90px_rgba(0,0,0,0.34)]">
        <p className="text-sm font-bold uppercase text-sky-200/80">Ecliptic Store</p>
        <h1 className="mt-3 text-2xl font-black">Страница не открылась</h1>
        <p className="mt-3 text-sm leading-6 text-white/58">
          Попробуйте открыть страницу заново или перейти прямо в админку редактирования сайта.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="/admin/products"
            className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-400 active:scale-95"
          >
            Открыть админку
          </a>
          <button
            onClick={() => {
              reset();
              window.location.reload();
            }}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 active:scale-95"
          >
            Обновить
          </button>
        </div>
      </div>
    </main>
  );
}
