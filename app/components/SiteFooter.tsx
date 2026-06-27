export default function SiteFooter() {
  return (
    <footer className="relative mt-auto border-t border-white/10 bg-[#050913]/72 px-4 pb-28 pt-8 text-white backdrop-blur-md sm:pb-10">
      <div className="mx-auto grid w-full max-w-[1400px] gap-7 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <p className="text-xl font-black">Ecliptic Store</p>
          <p className="mt-3 max-w-[460px] text-sm leading-6 text-white/62">
            Ecliptic Store — интернет магазин. Оформление интернет-покупок в
            Приднестровье.
          </p>
          <p className="mt-3 max-w-[560px] text-sm leading-6 text-white/55">
            Цифровые товары, игровые пополнения и подписки: Steam, Telegram
            Premium, Telegram Stars, Roblox, PUBG Mobile, Brawl Stars, Standoff
            2, PlayStation, Minecraft и другие направления.
          </p>
          <p className="mt-3 max-w-[620px] text-sm leading-6 text-white/48">
            Нас ищут как Ecliptic Store, Эклиптик Стор, Эклиптик магазин или
            донат игры в Тирасполе. Мы работаем для покупателей из ПМР и
            Приднестровья, помогаем быстро оформить игровые услуги, подписки и
            интернет-покупки через менеджера.
          </p>
        </div>

        <div>
          <p className="text-sm font-bold uppercase text-white/85">Связь</p>
          <div className="mt-3 flex flex-col items-start gap-2 text-sm text-white/65">
            <a
              href="https://t.me/Ecliptic_Store"
              target="_blank"
              rel="noopener noreferrer"
              data-analytics="telegram_channel"
              className="inline-flex transition hover:text-white"
            >
              Telegram-канал
            </a>
            <a
              href="https://t.me/Ecliptic_Store_PMR"
              target="_blank"
              rel="noopener noreferrer"
              data-analytics="telegram_support"
              className="inline-flex transition hover:text-white"
            >
              Менеджер
            </a>
            <a
              href="https://t.me/Ecliptic_Store_Reviews"
              target="_blank"
              rel="noopener noreferrer"
              data-analytics="telegram_reviews"
              className="inline-flex transition hover:text-white"
            >
              Отзывы
            </a>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold uppercase text-white/85">Документы</p>
          <div className="mt-3 flex flex-col items-start gap-2 text-sm text-white/65">
            <a href="/policy" className="inline-flex transition hover:text-white">
              Конфиденциальность
            </a>
            <a href="/terms" className="inline-flex transition hover:text-white">
              Пользовательское соглашение
            </a>
            <a href="/refund" className="inline-flex transition hover:text-white">
              Политика возврата
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
