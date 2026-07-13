import { AuthProvider } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import I18nProvider from '../components/I18nProvider';
import './globals.css';

export const metadata = {
  title: 'Sheger ERP',
  description: 'A comprehensive multi-factory food production and supply chain management system for managing factories, warehouses, sales, and workforce.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
