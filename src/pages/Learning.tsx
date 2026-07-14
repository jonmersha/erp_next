"use client";
import React from 'react';
import Link from 'next/link';
import { learningContent } from '../constants/learning';
import { ArrowLeft, BookOpen } from 'lucide-react';

const Learning: React.FC<{ feature?: string; }> = ({ feature }) => {
  const content = feature ? learningContent[feature] : null;

  if (!content) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Learning module not found.</h2>
        <Link href="/" className="text-[var(--color-main)] underline mt-4 block">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <Link href="/" className="flex items-center text-[var(--color-text)]/60 hover:text-[var(--color-text)]">
        <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
      </Link>
      <header className="flex items-center space-x-4">
        <div className="p-4 bg-[var(--color-main)]/10 rounded-2xl text-[var(--color-main)]">
          <BookOpen size={32} />
        </div>
        <div>
          <h2 className="text-4xl font-serif font-bold text-[var(--color-main)]">{content.title}</h2>
          <p className="text-[var(--color-text)]/40 mt-1">{content.description}</p>
        </div>
      </header>

      <div className="bg-[var(--color-surface)] p-8 rounded-3xl border border-[var(--color-text)]/20 shadow-sm space-y-6">
        <h3 className="text-xl font-bold text-[var(--color-text)]">How it Works</h3>
        <ul className="space-y-4">
          {content.howItWorks.map((step, index) => (
            <li key={index} className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[var(--color-main)] text-white rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <span className="text-[var(--color-text)]/80">{step}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Learning;
