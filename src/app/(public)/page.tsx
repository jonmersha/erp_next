"use client";

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { ArrowRight, BarChart3, Factory, Package, Truck, Users, ShieldCheck, Zap, Globe } from 'lucide-react';

export default function LandingPage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: <Factory size={32} className="text-[var(--color-main)]" />,
      title: t('Manufacturing Execution'),
      description: t('Streamline factory floor operations, manage recipes, and monitor production quality in real-time.')
    },
    {
      icon: <Truck size={32} className="text-amber-500" />,
      title: t('Supply Chain'),
      description: t('End-to-end visibility of your supply chain, from procurement to warehouse management and logistics.')
    },
    {
      icon: <Users size={32} className="text-blue-500" />,
      title: t('Human Resources'),
      description: t('Manage employee records, payroll, performance tracking, and training programs efficiently.')
    },
    {
      icon: <BarChart3 size={32} className="text-purple-500" />,
      title: t('Finance & Analytics'),
      description: t('Comprehensive financial reporting, budgeting, and real-time operational analytics.')
    }
  ];

  const benefits = [
    {
      icon: <Zap size={24} />,
      title: t('Lightning Fast'),
      description: t('Built on modern architecture for optimal performance.')
    },
    {
      icon: <ShieldCheck size={24} />,
      title: t('Bank-grade Security'),
      description: t('Role-based access control and encrypted data storage.')
    },
    {
      icon: <Globe size={24} />,
      title: t('Multi-lingual'),
      description: t('Native support for English, Amharic, and Afaan Oromoo.')
    }
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 inset-x-0 h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[70%] rounded-full bg-[var(--color-main)]/10 blur-[100px]" />
          <div className="absolute top-[20%] -left-[10%] w-[40%] h-[60%] rounded-full bg-[var(--color-accent)]/10 blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[var(--color-main)]/10 text-[var(--color-main)] text-sm font-semibold mb-6">
                <span className="w-2 h-2 rounded-full bg-[var(--color-main)] animate-pulse" />
                <span>{t('Next Generation ERP System')}</span>
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold font-serif text-[var(--color-text)] tracking-tight leading-[1.1] mb-8">
                {t('Manage your enterprise with')} <span className="text-[var(--color-main)]">{t('intelligence')}</span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <p className="text-xl text-[var(--color-text)]/70 mb-10 max-w-2xl mx-auto leading-relaxed">
                {t('A comprehensive multi-factory food production and supply chain management system designed for scale, speed, and security.')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
            >
              <Link 
                href="/login" 
                className="w-full sm:w-auto px-8 py-4 bg-[var(--color-main)] text-white rounded-xl font-bold text-lg shadow-lg shadow-[var(--color-main)]/30 hover:shadow-[var(--color-main)]/50 hover:-translate-y-1 transition-all flex items-center justify-center space-x-2"
              >
                <span>{t('Get Started')}</span>
                <ArrowRight size={20} />
              </Link>
              <Link 
                href="#features" 
                className="w-full sm:w-auto px-8 py-4 bg-[var(--color-surface)] border-2 border-[var(--color-border)] text-[var(--color-text)] rounded-xl font-bold text-lg hover:bg-[var(--color-bg)] transition-colors flex items-center justify-center"
              >
                {t('Explore Features')}
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 bg-[var(--color-surface)] border-y border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center space-x-4 p-4"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--color-main)]/10 text-[var(--color-main)] flex items-center justify-center shrink-0">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="font-bold text-[var(--color-text)] text-lg">{benefit.title}</h3>
                  <p className="text-[var(--color-text)]/70 text-sm mt-1">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section id="features" className="py-24 bg-[var(--color-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-[var(--color-text)] mb-6">
              {t('Everything you need to run your operations')}
            </h2>
            <p className="text-lg text-[var(--color-text)]/70 max-w-3xl mx-auto">
              {t('Sheger ERP - Milki Food Complex Test brings all your business processes into a single, unified platform. From raw materials to finished goods, track everything in real-time.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 lg:p-10 rounded-3xl shadow-sm hover:shadow-xl transition-shadow group"
              >
                <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-[var(--color-text)] mb-4">{feature.title}</h3>
                <p className="text-[var(--color-text)]/70 text-lg leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-24 bg-[var(--color-shell)] text-[var(--color-shell-text)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold font-serif text-white mb-8">
            {t('Ready to transform your business?')}
          </h2>
          <p className="text-xl text-white/80 mb-10">
            {t('Join the hundreds of factories and enterprises relying on Sheger ERP - Milki Food Complex Test to power their daily operations.')}
          </p>
          <Link 
            href="/login" 
            className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-[var(--color-shell)] rounded-xl font-bold text-lg hover:bg-gray-100 hover:scale-105 transition-all shadow-xl"
          >
            <span>{t('Access System')}</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
