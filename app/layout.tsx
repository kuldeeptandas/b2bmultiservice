import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "./pwa-register";

export const metadata: Metadata = {
  title: "B2B Multi Service | ITR, Loans, Insurance, FSSAI & Govt Facilitation",
  description:
    "All-in-one B2B & B2C business portal for ITR filing, bank loan processing, 3rd party motor insurance, FSSAI licensing, GST and PAN card facilitation.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "B2B Multi Service",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e40af",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className="bg-slate-50 text-slate-900 antialiased">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
