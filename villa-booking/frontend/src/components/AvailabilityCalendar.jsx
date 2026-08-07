'use client'
import { useEffect, useState, useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { getVillaAvailability } from '../services/villaService';

const STATUS = {
  AVAILABLE: { label: 'Available', tooltip: 'Available to book.', color: 'bg-emerald-400 hover:bg-emerald-600', text: 'text-emerald-900', selectable: true },
  PAYMENT_PENDING: { label: 'Payment in Progress', tooltip: 'Payment in progress. Availability is not guaranteed.', color: 'bg-amber-400', text: 'text-amber-900', selectable: false },
  BOOKED: { label: 'Booked', tooltip: 'Booked.', color: 'bg-red-500', text: 'text-red-50', selectable: false },
  BLOCKED: { label: 'Blocked', tooltip: 'Dates are blocked by the property.', color: 'bg-gray-900', text: 'text-gray-300', selectable: false },
  PAST: { label: 'Past', tooltip: 'This date has already passed.', color: 'bg-gray-200', text: 'text-gray-400', selectable: false },
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const toDate = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const pad = (n) => String(n).padStart(2, '0');
const toDateInput = (d) => {
  const x = toDate(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};

const LegendItem = ({ color, label }) => (
  <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
    <span className={`w-3 h-3 rounded ${color}`} />
    {label}
  </span>
);

/**
 * Production availability calendar for a villa. Drives checkIn/checkOut
 * (YYYY-MM-DD) via onChange. Fetches per-date status from the backend.
 *
 * - Green  (AVAILABLE):      selectable
 * - Yellow (PAYMENT_PENDING): payment in progress — tooltip "Availability is not guaranteed"
 * - Red    (BOOKED):         locked — tooltip "Booked"
 * - Black  (BLOCKED):        admin-blocked
 */
function AvailabilityCalendar({ villaId, value, onChange, showLegend = true }) {
  const [availability, setAvailability] = useState(null);
  const [anchor, setAnchor] = useState(() => new Date());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    getVillaAvailability(villaId, 120)
      .then((data) => { if (mounted.current) setAvailability(data); })
      .catch(() => { if (mounted.current) setAvailability({ availability: {} }); });
    return () => { mounted.current = false; };
  }, [villaId]);

  const move = (dir) => setAnchor((prev) => {
    const m = new Date(prev);
    m.setDate(1);
    m.setMonth(m.getMonth() + dir);
    return m;
  });

  const todayMs = toDate(new Date()).getTime();

  const statusFor = (d) => {
    if (d.getTime() < todayMs) return STATUS.PAST;
    const k = toDateInput(d);
    const s = availability?.availability?.[k];
    if (s === 'BOOKED') return STATUS.BOOKED;
    if (s === 'PAYMENT_PENDING') return STATUS.PAYMENT_PENDING;
    if (s === 'BLOCKED') return STATUS.BLOCKED;
    return STATUS.AVAILABLE;
  };

  const rangeStartMs = value?.checkIn ? toDate(value.checkIn).getTime() : null;
  const rangeEndMs = value?.checkOut ? toDate(value.checkOut).getTime() : null;

  const inRange = (ms) => {
    if (rangeStartMs == null) return false;
    if (rangeEndMs != null) return ms >= rangeStartMs && ms < rangeEndMs;
    return ms === rangeStartMs;
  };

  const handleClick = (d) => {
    if (!statusFor(d).selectable) return;
    const input = toDateInput(d);
    const ms = d.getTime();

    // No start yet → this click becomes the start.
    if (rangeStartMs == null) {
      onChange?.({ checkIn: input, checkOut: '' });
      return;
    }

    // Already have a start but no end:
    if (rangeEndMs == null) {
      // Clicking the current start again clears it.
      if (ms === rangeStartMs) {
        onChange?.({ checkIn: '', checkOut: '' });
        return;
      }
      // Keep order: earlier click becomes start, later click becomes end.
      if (ms < rangeStartMs) {
        onChange?.({ checkIn: input, checkOut: value.checkIn });
      } else {
        onChange?.({ checkIn: value.checkIn, checkOut: input });
      }
      return;
    }

    // Both set → treat the click as a fresh start so the range is easy to adjust.
    onChange?.({ checkIn: input, checkOut: '' });
  };

  const cells = [];
  {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const lead = first.getDay();
    const count = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= count; d++) cells.push(new Date(anchor.getFullYear(), anchor.getMonth(), d));
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      {showLegend && (
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <LegendItem color="bg-emerald-400" label="Available" />
          <LegendItem color="bg-amber-400" label="Payment in Progress" />
          <LegendItem color="bg-red-500" label="Booked" />
          <LegendItem color="bg-gray-900" label="Blocked" />
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-display text-base">{MONTH_NAMES[anchor.getMonth()]} {anchor.getFullYear()}</h4>
        <div className="flex gap-1">
          <button type="button" onClick={() => move(-1)} aria-label="Previous month"
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600">
            <FaChevronLeft />
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Next month"
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600">
            <FaChevronRight />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1 text-center">
        {DAY_NAMES.map((d) => <span key={d} className="text-[10px] text-gray-400 uppercase py-1">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const st = statusFor(d);
          const range = inRange(d.getTime());
          return (
            <button
              key={d.toISOString()}
              type="button"
              title={st.tooltip}
              disabled={!st.selectable}
              onClick={() => handleClick(d)}
              style={range ? { backgroundColor: '#60a5fa', color: '#fff' } : undefined}
              className={`relative h-9 rounded-md text-xs font-medium flex items-center justify-center ${range ? 'bg-blue-400 text-white hover:bg-blue-500' : `${st.color} ${st.text}`} ${st.selectable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-gray-400">
        Availability updates in real time. Only one customer can book a date range — first payment wins.
      </p>
    </div>
  );
}

export default AvailabilityCalendar;