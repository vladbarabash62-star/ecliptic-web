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
import {
  buildSeoKeywords,
  buildStoreJsonLd,
  SITE_DESCRIPTION,
  SITE_IMAGE,
  SITE_LOGO,
  SITE_NAME,
  SITE_URL,
  stringifyJsonLd,
} from "../lib/seo";
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

const seoKeywords = Array.from(
  new Set([
    ...seoKeywordBase,
    ...seoProducts,
    ...buildSeoKeywords(1000),
  ])
).slice(0, 1000);

const siteSearchTitle = `${SITE_NAME} - Эклиптик Стор`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: siteSearchTitle,
    template: `%s | ${siteSearchTitle}`,
  },
  description: SITE_DESCRIPTION,
  keywords: seoKeywords,
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: [
      { url: "/google-favicon.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: [{ url: "/google-favicon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/apple-icon.png", sizes: "512x512" }],
  },
  openGraph: {
    title: siteSearchTitle,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "ru_RU",
    type: "website",
    images: [
      {
        url: SITE_IMAGE,
        alt: `${SITE_NAME} - Эклиптик Стор`,
        width: 1024,
        height: 1024,
      },
      {
        url: SITE_LOGO,
        alt: `${SITE_NAME} logo`,
        width: 512,
        height: 512,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteSearchTitle,
    description: SITE_DESCRIPTION,
    images: [SITE_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: stringifyJsonLd(buildStoreJsonLd()),
          }}
        />

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
