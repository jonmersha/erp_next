"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Factory, Globe, Menu, Moon, Sun, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsLangMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-300">
      {/* Public Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-[var(--color-main)] rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Factory size={22} />
              </div>
              <span className="text-2xl font-bold font-serif text-[var(--color-main)] tracking-tight">
                Sheger ERP - Milki Food Complex Test
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-[var(--color-text)]/80 hover:text-[var(--color-main)] font-medium transition-colors">
                {t('Features')}
              </Link>
              <Link href="#solutions" className="text-[var(--color-text)]/80 hover:text-[var(--color-main)] font-medium transition-colors">
                {t('Solutions')}
              </Link>
              <Link href="#contact" className="text-[var(--color-text)]/80 hover:text-[var(--color-main)] font-medium transition-colors">
                {t('Contact')}
              </Link>
            </nav>

            {/* Right Tools */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className="p-2 text-[var(--color-text)]/80 hover:bg-[var(--color-text)]/5 rounded-full transition-colors flex items-center"
                >
                  <Globe size={20} />
                </button>
                {isLangMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-32 bg-[var(--color-surface)] shadow-lg border border-[var(--color-border)] py-1 z-50 rounded-xl overflow-hidden">
                    <button onClick={() => changeLanguage('en')} className="w-full text-left px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]">English</button>
                    <button onClick={() => changeLanguage('am')} className="w-full text-left px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]">አማርኛ</button>
                    <button onClick={() => changeLanguage('om')} className="w-full text-left px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]">Afaan Oromoo</button>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button onClick={toggleTheme} className="p-2 text-[var(--color-text)]/80 hover:bg-[var(--color-text)]/5 rounded-full transition-colors">
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>

              {/* Login CTA */}
              <Link 
                href="/login" 
                className="flex items-center space-x-2 bg-[var(--color-main)] text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-green-700 transition-colors ml-4"
              >
                <span>{t('Login')}</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-[var(--color-text)]/80 hover:bg-[var(--color-text)]/5 rounded-lg"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-64 bg-[var(--color-surface)] z-50 flex flex-col pt-6 shadow-2xl md:hidden border-l border-[var(--color-border)]"
            >
              <div className="flex justify-between items-center px-6 pb-6 border-b border-[var(--color-border)]">
                <span className="text-xl font-bold font-serif text-[var(--color-main)]">Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-[var(--color-bg)] rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <nav className="flex flex-col flex-1 p-4 space-y-2">
                <Link href="#features" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-lg font-medium rounded-xl hover:bg-[var(--color-bg)]">
                  {t('Features')}
                </Link>
                <Link href="#solutions" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-lg font-medium rounded-xl hover:bg-[var(--color-bg)]">
                  {t('Solutions')}
                </Link>
                <Link href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-lg font-medium rounded-xl hover:bg-[var(--color-bg)]">
                  {t('Contact')}
                </Link>
              </nav>

              <div className="p-6 border-t border-[var(--color-border)] flex flex-col space-y-4">
                <div className="flex justify-center space-x-4">
                  <button onClick={toggleTheme} className="p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)]">
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                  </button>
                  <button onClick={() => changeLanguage(i18n.language === 'en' ? 'am' : 'en')} className="p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] flex items-center justify-center font-bold">
                    {i18n.language.toUpperCase()}
                  </button>
                </div>
                <Link 
                  href="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-4 bg-[var(--color-main)] text-white rounded-xl font-bold shadow-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>{t('Go to Login')}</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Public Footer */}
      <footer className="bg-[var(--color-surface)] border-t border-[var(--color-border)] py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[var(--color-main)] rounded-lg flex items-center justify-center text-white">
              <Factory size={16} />
            </div>
            <span className="text-xl font-bold font-serif text-[var(--color-text)]">
              Sheger ERP - Milki Food Complex Test
            </span>
          </div>
          <p className="text-[var(--color-text)]/60 text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} Sheger ERP. {t('All rights reserved.')}
          </p>
          <div className="flex space-x-6 text-[var(--color-text)]/60">
            <Link href="#" className="hover:text-[var(--color-main)] text-sm">{t('Privacy Policy')}</Link>
            <Link href="#" className="hover:text-[var(--color-main)] text-sm">{t('Terms of Service')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
