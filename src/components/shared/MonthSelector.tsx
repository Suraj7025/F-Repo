// ========================================
// Month Selector Component
// ========================================

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../../lib/store';
import { getMonthLabel, getPreviousMonth } from '../../lib/utils';
import { format, addMonths, parse } from 'date-fns';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function MonthSelector() {
  const selectedMonth = useStore((s) => s.selectedMonth);
  const yearView = useStore((s) => s.yearView);
  const setSelectedMonth = useStore((s) => s.setSelectedMonth);
  const setYearView = useStore((s) => s.setYearView);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => Number(selectedMonth.slice(0, 4)));
  const firstYear = Math.floor(pickerYear / 12) * 12;

  const goBack = () => {
    if (yearView) {
      setSelectedMonth(`${Number(selectedMonth.slice(0, 4)) - 1}-01`);
      return;
    }
    setSelectedMonth(getPreviousMonth(selectedMonth));
  };

  const goForward = () => {
    if (yearView) {
      setSelectedMonth(`${Number(selectedMonth.slice(0, 4)) + 1}-01`);
      return;
    }
    const date = parse(selectedMonth, 'yyyy-MM', new Date());
    setSelectedMonth(format(addMonths(date, 1), 'yyyy-MM'));
  };

  const goToday = () => {
    setSelectedMonth(format(new Date(), 'yyyy-MM'));
    setYearView(false);
    setPickerOpen(false);
  };

  const openPicker = () => {
    setPickerYear(Number(selectedMonth.slice(0, 4)));
    setPickerOpen((open) => !open);
  };

  const chooseYear = (year: number) => {
    setPickerYear(year);
    if (yearView) {
      setSelectedMonth(`${year}-01`);
      setPickerOpen(false);
    }
  };

  const chooseMonth = (monthIndex: number) => {
    setSelectedMonth(`${pickerYear}-${String(monthIndex + 1).padStart(2, '0')}`);
    setYearView(false);
    setPickerOpen(false);
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="glass-sm relative flex items-center gap-1 p-1">
        <button className="btn-icon" onClick={goBack} aria-label={yearView ? 'Previous year' : 'Previous month'}>
          <ChevronLeft size={18} />
        </button>
        <motion.button
          type="button"
          key={selectedMonth + String(yearView)}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-3 py-1 font-semibold text-sm min-w-[140px] text-center tabular-nums rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
          style={{ color: 'var(--text-primary)' }}
          onClick={openPicker}
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          aria-label="Choose month and year"
        >
          {yearView ? `${selectedMonth.slice(0, 4)} (Year)` : getMonthLabel(selectedMonth)}
        </motion.button>
        <button className="btn-icon" onClick={goForward} aria-label={yearView ? 'Next year' : 'Next month'}>
          <ChevronRight size={18} />
        </button>

        {pickerOpen && (
          <div
            role="dialog"
            aria-label="Choose month and year"
            className="glass absolute left-0 top-full z-[60] mt-2 w-[min(320px,calc(100vw-2rem))] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <button className="btn-icon" onClick={() => setPickerYear((year) => year - 12)} aria-label="Previous 12 years">
                <ChevronLeft size={18} />
              </button>
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {firstYear}–{firstYear + 11}
              </span>
              <button className="btn-icon" onClick={() => setPickerYear((year) => year + 12)} aria-label="Next 12 years">
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 mb-4">
              {Array.from({ length: 12 }, (_, index) => firstYear + index).map((year) => {
                const isSelected = year === Number(selectedMonth.slice(0, 4));
                return (
                  <button
                    key={year}
                    type="button"
                    className={`rounded-xl px-2 py-2 text-sm transition-colors ${isSelected ? 'chip-active' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
                    style={{ color: isSelected ? 'white' : 'var(--text-primary)' }}
                    onClick={() => chooseYear(year)}
                    aria-pressed={isSelected}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-black/5 dark:border-white/10 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
                {pickerYear} · Choose month
              </p>
              <div className="grid grid-cols-3 gap-1">
                {months.map((month, index) => {
                  const isSelected = pickerYear === Number(selectedMonth.slice(0, 4)) && index + 1 === Number(selectedMonth.slice(5, 7));
                  return (
                    <button
                      key={month}
                      type="button"
                      className={`rounded-xl px-2 py-2 text-sm transition-colors ${isSelected ? 'chip-active' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
                      style={{ color: isSelected ? 'white' : 'var(--text-primary)' }}
                      onClick={() => chooseMonth(index)}
                    >
                      {month.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
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
