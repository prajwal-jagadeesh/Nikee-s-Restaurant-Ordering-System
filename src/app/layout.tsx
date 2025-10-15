import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import PageHeader from '@/components/PageHeader';

export const metadata: Metadata = {
  title: "Nikee's Zara OrderFlow",
  description: 'A complete ordering system for Nikee\'s Zara Multicuisine Rooftop.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <div className="relative flex min-h-screen w-full flex-col">
          <PageHeader />
          <main className="flex-1">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
