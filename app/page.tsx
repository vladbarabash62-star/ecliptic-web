"use client";

import { useEffect, useState } from "react";

const products = [
  {
    name: "Standoff 2",
    icon: "https://www.google.com/s2/favicons?sz=128&domain_url=https://standoff2.com",
  },
  {
    name: "PUBG Mobile",
    icon: "https://www.google.com/s2/favicons?sz=128&domain_url=https://www.pubgmobile.com",
  },
  {
    name: "Brawl Stars",
    icon: "https://www.google.com/s2/favicons?sz=128&domain_url=https://supercell.com/en/games/brawlstars/",
  },
  {
    name: "Roblox",
    icon: "https://cdn.simpleicons.org/roblox/ffffff",
  },
  {
    name: "Minecraft",
    icon: "https://www.google.com/s2/favicons?sz=128&domain_url=https://www.minecraft.net",
  },
  {
    name: "Clash Royale",
    icon: "https://www.google.com/s2/favicons?sz=128&domain_url=https://supercell.com/en/games/clashroyale/",
  },
  {
    name: "Mobile Legends",
    icon: "https://www.google.com/s2/favicons?sz=128&domain_url=https://m.mobilelegends.com",
  },
  {
    name: "Free Fire",
    icon: "https://www.google.com/s2/favicons?sz=128&domain_url=https://ff.garena.com",
  },
  {
    name: "GTA 5 RP",
    icon: "https://www.google.com/s2/favicons?sz=128&domain_url=https://gta5rp.com",
  },
  {
    name: "Amazing RP",
    icon: "https://www.google.com/s2/favicons?sz=128&domain_url=https://amazing-rp.ru",
  },
  {
    name: "Black Russia",
    icon: "https://www.google.com/s2/favicons?sz=128&domain_url=https://blackrussia.online",
  },
  {
    name: "PlayStation",
    icon: "https://cdn.simpleicons.org/playstation/ffffff",
  },
  {
    name: "Boosty",
    icon: "https://www.google.com/s2/favicons?sz=128&domain_url=https://boosty.to",
  },
  {
    name: "Twitch",
    icon: "https://cdn.simpleicons.org/twitch/ffffff",
  },
  {
    name: "Telegram аккаунты",
    icon: "https://cdn.simpleicons.org/telegram/ffffff",
  },
  {
    name: "Telegram Premium",
    icon: "https://cdn.simpleicons.org/telegram/ffffff",
  },
  {
    name: "Telegram Stars",
    icon: "https://cdn.simpleicons.org/telegram/ffffff",
  },
  {
    name: "Steam пополнение",
    icon: "https://cdn.simpleicons.org/steam/ffffff",
  },
  {
    name: "Spotify Premium",
    icon: "https://cdn.simpleicons.org/spotify/ffffff",
  },
  {
    name: "YouTube Premium",
    icon: "https://cdn.simpleicons.org/youtube/ffffff",
  },
  {
    name: "TikTok Coins",
    icon: "https://cdn.simpleicons.org/tiktok/ffffff",
  },
];

export default function HomePage() {
  const [isMobileLike, setIsMobileLike] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobileLike(window.innerWidth < 500);
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);

    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  return (
    <main className="min-h-screen bg-[#0b0d12] text-white">
      <div className="mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-5 sm:mb-7 text-center">
      <div className="mb-2 flex justify-center">
  <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
    Ecliptic Store
  </div>
</div>
<h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
  <span className="block">Добро пожаловать в</span>
<span className="block text-white text-3xl sm:text-4xl">
  Ecliptic Store
</span>
          <p className="mt-2 max-w-2xl text-sm text-white/60 sm:text-base mx-auto">
            Выберите нужный товар 
          </p>
        </div>

        <section className={isMobileLike ? "grid grid-cols-3 gap-3" : "grid grid-cols-4 gap-4"}>
          {products.map((product) => (
            <button
              key={product.name}
              type="button"
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#12151c] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-[#171b24] hover:shadow-[0_10px_30px_rgba(0,0,0,0.35)] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative flex h-full flex-col items-center justify-start p-2 sm:p-3 md:p-4">
                <div className="mb-2 flex aspect-square w-full items-center justify-center rounded-2xl border border-white/10 bg-[#0d1016] shadow-inner sm:mb-3">
                  <img
                    src={product.icon}
                    alt={product.name}
                    className="h-[32px] w-[32px] object-contain sm:h-[42px] sm:w-[42px] md:h-[54px] md:w-[54px]"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <h3 className="text-center text-[11px] font-semibold leading-tight text-white/90 sm:text-xs md:text-sm">
                  {product.name}
                </h3>
              </div>
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}