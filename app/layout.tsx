import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SpaceScene from "../components/space-scene";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Ecliptic Store — донат в игры | Тирасполь",
    template: "%s | Ecliptic Store",
  },
  description:
  "Ecliptic Store — магазин доната и пополнения игр в Тирасполе и ПМР. Пополнение Steam, Brawl Stars, Roblox, PUBG Mobile, Free Fire, Standoff 2, Fortnite, Genshin Impact, Valorant и других игр.",
    keywords: [
      "Ecliptic Store",
      "эклиптик стор",
      "эклиптик магазин",
      "Ecliptic Store PMR",
      "Ecliptic Store ПМР",
      "Ecliptic Store Тирасполь",
      "донат в игры",
      "донат игр",
      "магазин доната",
      "игровой донат",
      "пополнение игр",
      "пополнение аккаунтов",
      "пополнение баланса игр",
      "донат Тирасполь",
      "донат ПМР",
      "донат Приднестровье",
      "пополнение Steam",
      "пополнение стим",
      "Steam пополнение",
      "пополнить Steam ПМР",
      "пополнить Steam Тирасполь",
      "донат Steam",
      "Brawl Stars донат",
      "пополнение Brawl Stars",
      "донат Brawl Stars",
      "Roblox донат",
      "Robux купить",
      "пополнение Roblox",
      "PUBG донат",
      "PUBG Mobile донат",
      "пополнение PUBG Mobile",
      "Free Fire донат",
      "пополнение Free Fire",
      "Standoff 2 донат",
      "пополнение Standoff 2",
      "Fortnite донат",
      "пополнение Fortnite",
      "Genshin Impact донат",
      "пополнение Genshin Impact",
      "Valorant донат",
      "пополнение Valorant",
      "CS2 скины",
      "CS2 донат",
      "пополнение игр Тирасполь",
      "пополнение игр ПМР",
      "игровой магазин Тирасполь",
      "игровой магазин ПМР",
    ],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Ecliptic Store",
    description: "Магазин доната в игры",
    url: "https://ecliptic.website",
    siteName: "Ecliptic Store",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col overflow-x-hidden bg-[#05070d]">
        <SpaceScene />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}