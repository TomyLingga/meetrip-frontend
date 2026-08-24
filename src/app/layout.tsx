import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { FeedbackProvider } from "@/context/FeedbackContext";

import AppLayout from "@/components/layout/AppLayout";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "MeeTrip | Portal Perjalanan Dinas & Meeting",
  description: "Aplikasi Terpadu Kalender Meeting & Pengajuan Perjalanan Dinas PT Industri Nabati Lestari",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plusJakartaSans.variable}>
      <body className="font-sans">
        <FeedbackProvider>
          <AppLayout>{children}</AppLayout>
        </FeedbackProvider>
      </body>
    </html>
  );
}
