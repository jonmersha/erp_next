import { AuthProvider } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import I18nProvider from '../components/I18nProvider';
import { Inter, Noto_Sans_Ethiopic } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoSansEthiopic = Noto_Sans_Ethiopic({ 
  subsets: ['ethiopic'], 
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-ethiopic' 
});

export const metadata = {
  title: 'Sheger ERP',
  description: 'A comprehensive multi-factory food production and supply chain management system for managing factories, warehouses, sales, and workforce.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSansEthiopic.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ErrorBoundary>
          <I18nProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </I18nProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
