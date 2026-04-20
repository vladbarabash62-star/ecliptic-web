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

function BackgroundPlanets() {
  const planets = [
    {
      size: 170,
      top: "8%",
      left: "-40px",
      duration: "26s",
      delay: "0s",
      rotate: "-18deg",
      opacity: 0.12,
    },
    {
      size: 120,
      top: "18%",
      right: "6%",
      duration: "22s",
      delay: "2s",
      rotate: "24deg",
      opacity: 0.1,
    },
    {
      size: 150,
      top: "52%",
      left: "4%",
      duration: "30s",
      delay: "1s",
      rotate: "12deg",
      opacity: 0.08,
    },
    {
      size: 110,
      top: "72%",
      right: "10%",
      duration: "24s",
      delay: "3s",
      rotate: "-28deg",
      opacity: 0.1,
    },
    {
      size: 90,
      top: "84%",
      left: "42%",
      duration: "20s",
      delay: "0.5s",
      rotate: "16deg",
      opacity: 0.07,
    },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {planets.map((planet, index) => (
        <div
          key={index}
          className="absolute animate-[floatPlanet_var(--duration)_ease-in-out_infinite]"
          style={
            {
              width: `${planet.size}px`,
              height: `${planet.size}px`,
              top: planet.top,
              left: planet.left,
              right: planet.right,
              opacity: planet.opacity,
              ["--duration" as string]: planet.duration,
              animationDelay: planet.delay,
              transform: `rotate(${planet.rotate})`,
            } as React.CSSProperties
          }
        >
          <div className="relative h-full w-full">
            <div className="absolute inset-[18%] rounded-full border border-white/25 bg-white/5" />
            <div className="absolute left-[-8%] top-[42%] h-[16%] w-[116%] -translate-y-1/2 rounded-full border-2 border-white/35" />
            <div className="absolute left-[50%] top-[24%] h-2 w-2 -translate-x-1/2 rounded-full bg-white/60 blur-[1px]" />
          </div>
        </div>
      ))}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(11,13,18,0.18)_55%,rgba(11,13,18,0.55)_100%)]" />
    </div>
  );
}

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
    <main className="relative min-h-screen overflow-hidden bg-[#0b0d12] text-white">
      <style jsx global>{`
        @keyframes floatPlanet {
          0% {
            transform: translate3d(0, 0, 0) rotate(var(--rotate, 0deg));
          }
          50% {
            transform: translate3d(0, -14px, 0) rotate(var(--rotate, 0deg));
          }
          100% {
            transform: translate3d(0, 0, 0) rotate(var(--rotate, 0deg));
          }
        }
      `}</style>

      <BackgroundPlanets />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_30%)]" />

      <div className="relative mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-4 sm:py-6">
        <div className="mb-6 text-center sm:mb-8">
          <div className="mb-3 flex justify-center">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-white/70 backdrop-blur-sm">
              Ecliptic Store
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
            <span className="block text-white/90">Добро пожаловать в</span>
            <span className="mt-1 block text-white">Ecliptic Store</span>
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/60 sm:text-base">
            Выберите нужный товар
          </p>
        </div>

        <section
          className={
            isMobileLike ? "grid grid-cols-3 gap-3" : "grid grid-cols-4 gap-4"
          }
        >
          {products.map((product) => (
            <button
              key={product.name}
              type="button"
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[rgba(18,21,28,0.78)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-[rgba(23,27,36,0.92)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.42)] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_45%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative flex h-full flex-col items-center p-2 sm:p-3 md:p-4">
                <div className="mb-2 flex aspect-square w-full items-center justify-center rounded-2xl border border-white/10 bg-[#0a0d14]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:mb-3">
                  <img
                    src={product.icon}
                    alt={product.name}
                    className="h-[32px] w-[32px] object-contain sm:h-[42px] sm:w-[42px] md:h-[54px] md:w-[54px]"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <h3 className="min-h-[32px] text-center text-[11px] font-semibold leading-tight text-white/90 sm:text-xs md:text-sm">
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