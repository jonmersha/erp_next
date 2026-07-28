import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HelpTooltipProps {
  text: string;
  size?: number;
  className?: string;
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({ text, size = 18, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      <button className="text-[var(--color-text)]/40 hover:text-[var(--color-main)] transition-colors focus:outline-none">
        <HelpCircle size={size} />
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[100] w-64 p-3 mt-2 bg-white dark:bg-[#1A1A1A] text-[var(--color-text)] text-sm rounded-lg shadow-xl border border-[var(--color-border)] bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 pointer-events-none"
          >
            {/* Arrow */}
            <div className="absolute w-3 h-3 bg-white dark:bg-[#1A1A1A] border-b border-r border-[var(--color-border)] transform rotate-45 -bottom-1.5 left-1/2 -translate-x-1/2" />
            <div className="relative z-10 leading-relaxed font-normal">
              {text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HelpTooltip;
