import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  metadataBase: new URL('https://bigpayrolls.com'),
  title: {
    default: 'Big Payrolls | Payroll, HR compliance and tech for growing businesses',
    template: '%s | Big Payrolls',
  },
  description:
    'Big Payrolls runs your payroll, PF and ESI compliance and hiring, and builds the websites, apps and software your business runs on. Makers of PF Mitra and Auto Talent Grid.',
  icons: { apple: '/apple-touch-icon.png' },
  openGraph: {
    title: 'Big Payrolls',
    description: 'Payroll, people and tech, sorted.',
    url: 'https://bigpayrolls.com',
    siteName: 'Big Payrolls',
    images: ['/logo-stacked.png'],
    locale: 'en_IN',
    type: 'website',
  },
};

export const viewport: Viewport = { themeColor: '#FFFCF7' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
