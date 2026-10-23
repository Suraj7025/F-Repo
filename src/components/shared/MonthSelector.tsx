// ========================================
// Month Selector Component
// ========================================

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../../lib/store';
import { getMonthLabel, getPreviousMonth } from '../../lib/utils';
import { format, addMonths, parse } from 'date-fns';

export function MonthSelector() {
  const selectedMonth = useStore((s) => s.selectedMonth);
  const yearView = useStore((s) => s.yearView);
  const setSelectedMonth = useStore((s) => s.setSelectedMonth);
  const setYearView = useStore((s) => s.setYearView);

  const goBack = () => {
    setSelectedMonth(getPreviousMonth(selectedMonth));
  };

  const goForward = () => {
    const date = parse(selectedMonth, 'yyyy-MM', new Date());
    setSelectedMonth(format(addMonths(date, 1), 'yyyy-MM'));
  };

  const goToday = () => {
    setSelectedMonth(format(new Date(), 'yyyy-MM'));
    setYearView(false);
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="glass-sm flex items-center gap-1 p-1">
        <button className="btn-icon" onClick={goBack} aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <motion.span
          key={selectedMonth}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-3 py-1 font-semibold text-sm min-w-[140px] text-center tabular-nums"
          style={{ color: 'var(--text-primary)' }}
        >
          {yearView ? selectedMonth.split('-')[0] + ' (Year)' : getMonthLabel(selectedMonth)}
        </motion.span>
        <button className="btn-icon" onClick={goForward} aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>
      
      <button
        className="btn-icon"
        onClick={goToday}
        aria-label="Go to current month"
        title="Go to current month"
      >
        <Calendar size={18} />
      </button>

      <button
        className={`chip ${yearView ? 'chip-active' : ''}`}
        onClick={() => setYearView(!yearView)}
      >
        {yearView ? 'Year View' : 'This Year'}
      </button>
    </div>
  );
}
