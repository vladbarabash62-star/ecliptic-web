import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-[80svh] w-full items-center justify-center px-5 py-28 text-white">
      <div className="flex w-full max-w-xl flex-col items-center gap-8 text-center">
        <h1 className="text-2xl font-bold leading-snug sm:text-4xl">
          К сожалению, на этой странице ничего нет.
        </h1>
        <Link
          href="/"
          className="flex min-h-14 w-full max-w-xs items-center justify-center rounded-lg bg-white px-8 py-4 text-lg font-bold text-black transition hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          На главную
        </Link>
      </div>
    </main>
  );
}
