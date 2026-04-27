import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import HomeButton from "./components/HomeButton";
import "./globals.css";

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
    default: "Ecliptic Store",
    template: "%s | Ecliptic Store",
  },
  description:
    "Ecliptic Store — интернет магазин. Пополнение Steam, Brawl Stars, Roblox, Telegram Premium и других игр.",
  keywords: [
    "Ecliptic Store",
    "эклиптик стор",
    "донат в игры",
    "пополнение Steam",
    "Brawl Stars донат",
    "Roblox донат",
    "Telegram Premium",
    "Standoff 2",
    "донат ПМР",
    "донат Тирасполь",
  ],
  icons: {
    icon: "/favicon.ico",
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
    >
      <body className="relative min-h-screen overflow-x-hidden bg-[#04060c] text-white">
        
        {/* ЗВЕЗДЫ */}
        <div className="stars-layer stars-layer-1" />
        <div className="stars-layer stars-layer-2" />
        <div className="stars-layer stars-layer-3" />

        {/* КНОПКА НА ГЛАВНУЮ */}
        <HomeButton />

        {/* КОНТЕНТ */}
        <div className="relative z-10 min-h-screen">
          {children}
        </div>

      </body>
    </html>
  );
}