import Link from "next/link";
import type { Metadata } from "next";
import { getCustomerOrders, getCustomerUserFromCookies } from "../../lib/customerAuth";
import { getProducts } from "../../lib/productStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Ecliptic Store - Личный кабинет",
  robots: {
    index: false,
    follow: false,
  },
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

export default async function AccountPage() {
  const user = await getCustomerUserFromCookies();
  const [orders, products] = await Promise.all([
    user ? getCustomerOrders(user.id) : Promise.resolve([]),
    getProducts({ cached: true }).catch(() => []),
  ]);
  const productNames = new Map(products.map((product) => [product.slug, product.name]));

  return (
    <main className="relative min-h-screen w-full bg-transparent px-4 py-24 text-white sm:py-28">
      <section className="mx-auto w-full max-w-[980px]">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-bold text-white/76 transition hover:bg-white/10 hover:text-white"
          >
            На главную
          </Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#090f1b]/88 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.34)] backdrop-blur-md sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-sky-200/72">Личный кабинет</p>
              <h1 className="mt-2 text-4xl font-black sm:text-5xl">Мои заказы</h1>
              <p className="mt-3 max-w-[640px] text-sm font-semibold leading-relaxed text-white/58">
                Здесь сохраняются покупки, которые вы нажали на сайте после входа в аккаунт.
              </p>
            </div>
            {user ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm font-bold text-white/72">
                {user.username || user.email || user.name}
              </div>
            ) : null}
          </div>

          {!user ? (
            <div className="mt-7 rounded-2xl border border-sky-300/18 bg-sky-500/10 p-5 text-sm font-semibold leading-relaxed text-white/72">
              Войдите через кнопку “Авторизоваться” справа сверху, и после этого заказы начнут появляться в этом кабинете.
            </div>
          ) : orders.length ? (
            <div className="mt-7 grid gap-3">
              {orders.map((order) => {
                const productName = productNames.get(order.productSlug) || order.productSlug;

                return (
                  <article
                    key={order.id}
                    className="rounded-2xl border border-white/10 bg-[#0f1420]/86 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-lg font-black text-white">{productName}</div>
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
                );
              })}
            </div>
          ) : (
            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.045] p-5 text-sm font-semibold leading-relaxed text-white/62">
              Заказов пока нет. Выберите товар, нажмите “Купить”, и он появится здесь.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
