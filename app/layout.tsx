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

export const metadata = {
  title: {
    default: "Ecliptic Store",
    template: "%s | Ecliptic Store",
  },
  description: "Магазин игровых товаров",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col overflow-x-hidden bg-[#05070d]">
        <SpaceScene />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
