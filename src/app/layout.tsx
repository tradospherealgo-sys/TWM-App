import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegistrar } from '@/components/pwa/PwaRegistrar';

export const metadata: Metadata = {
  title: 'Tradosphere Wealth Management | TWM',
  description: 'Unified Financial Services Platform - Authorised Person of SMC Global Securities Ltd.',
  manifest: '/manifest.json',
  applicationName: 'Tradosphere Wealth Management',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TWM',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0B111E',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0B111E] text-slate-100 min-h-screen selection:bg-blue-600 selection:text-white">
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}
