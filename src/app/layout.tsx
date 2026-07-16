import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Elite Trader - Precision Trading",
    template: "%s | The Elite Trader",
  },
  description:
    "The premier learning platform for modern futures and crypto traders. Master professional strategies and risk management with The Elite Trader.",
  keywords: ["trading", "forex", "futures", "crypto", "signals", "elite trader", "theelitetrader"],
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full`}>
      <body className="min-h-full bg-[#050505] text-white antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
