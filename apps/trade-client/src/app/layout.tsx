import { Toaster } from '@baron/ui/components/sonner';
import { cn } from '@baron/ui/lib/utils';
import { Inter as FontSans, Poppins as FontSerif } from 'next/font/google';
import './globals.css';
import { Metadata } from 'next';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

const fontSerif = FontSerif({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Baron Trade Client',
};

export default async function LocaleLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return (
    <html>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased dark',
          fontSans.variable,
          fontSerif.variable,
        )}
      >
        {props.children}
        <Toaster />
      </body>
    </html>
  );
}
