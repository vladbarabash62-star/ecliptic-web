import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AnalyticsTracker from "./components/AnalyticsTracker";
import ContactButton from "./components/ContactButton";
import HomeButton from "./components/HomeButton";
import PageLoader from "./components/PageLoader";
import SiteFooter from "./components/SiteFooter";
import SwipeHomeGesture from "./components/SwipeHomeGesture";
import TelegramStartRouter from "./components/TelegramStartRouter";
import SpaceScene from "../components/space-scene";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const seoKeywordBase = [
  "Ecliptic Store",
  "ecliptic.website",
  "интернет магазин ПМР",
  "интернет магазин Приднестровье",
  "цифровые товары ПМР",
  "цифровые товары Приднестровье",
  "донат ПМР",
  "донат Приднестровье",
  "пополнение игр ПМР",
  "пополнение игр Приднестровье",
  "покупка подписок ПМР",
  "подписки Приднестровье",
  "Telegram магазин ПМР",
  "магазин цифровых товаров",
  "игровые товары онлайн",
  "пополнение Steam ПМР",
  "Telegram Premium ПМР",
  "купить донат ПМР",
  "купить донат Приднестровье",
  "оплата интернет покупок ПМР",
  "оформление интернет покупок Приднестровье",
];

const seoProducts = [
  "Steam",
  "Telegram Premium",
  "Telegram Stars",
  "Telegram аккаунт",
  "Epic Games",
  "PlayStation",
  "Standoff 2",
  "Тик ток",
  "PUBG Mobile",
  "Brawl Stars",
  "Clash of Clans",
  "Clash Royale",
  "Mobile Legends",
  "Roblox",
  "Free Fire",
  "Minecraft",
  "GTA 5 RP",
  "Majestic RP",
  "Radmir RP",
  "Amazing RP",
  "Black Russia",
  "World of Tanks",
  "TikTok",
  "Spotify Premium",
  "ChatGPT Plus",
  "Fortnite",
  "Genshin Impact",
  "Valorant",
  "Discord Nitro",
  "Boosty",
  "Twitch",
];

const seoKeywords = [
  ...seoKeywordBase,
  ...seoProducts.flatMap((product) => [
    product,
    `купить ${product}`,
    `${product} ПМР`,
    `${product} Приднестровье`,
    `пополнить ${product}`,
    `донат ${product}`,
    `${product} онлайн`,
    `${product} Ecliptic Store`,
  ]),
];

export const metadata: Metadata = {
  metadataBase: new URL("https://ecliptic.website"),
  title: {
    default: "Ecliptic Store",
    template: "%s | Ecliptic Store",
  },
  description: "Ecliptic Store — интернет магазин. Оформление интернет-покупок в Приднестровье.",
  keywords: seoKeywords,
  openGraph: {
    title: "Ecliptic Store",
    description: "Ecliptic Store — интернет магазин. Оформление интернет-покупок в Приднестровье.",
    url: "https://ecliptic.website",
    siteName: "Ecliptic Store",
    locale: "ru_RU",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="relative min-h-screen overflow-x-hidden bg-black text-white"
        suppressHydrationWarning
      >
        {/* ЗВЕЗДЫ */}
        <SpaceScene />

        {/* КНОПКА */}
        <PageLoader />
        <HomeButton />
        <ContactButton />
        <SwipeHomeGesture />
        <TelegramStartRouter />
        <AnalyticsTracker />

        {/* КОНТЕНТ */}
        <div className="site-content relative z-10 flex min-h-screen w-full flex-col">
          {children}
          <SiteFooter />
        </div>

      </body>
    </html>
  );
}
