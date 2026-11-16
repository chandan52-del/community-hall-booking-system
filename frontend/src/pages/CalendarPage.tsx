import React, { useState } from 'react';
import { Calendar as CalendarIcon, Wrench, ShieldCheck, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { formatTime } from '../lib/utils';

export const CalendarPage: React.FC = () => {
  const { halls, bookings, maintenance } = useData();
  const [selectedHallId, setSelectedHallId] = useState<string>('all');
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(10); // 10 = November 2026

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Generate days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  // Active hall filter
  const selectedHall = halls.find(h => h.id === selectedHallId);

  return (
    <div className="pb-24">
      {/* Page Header */}
      <section className="border-b border-line bg-paper">
        <div className="container-page py-12 md:py-16">
          <span className="eyebrow">Availability calendar</span>
          <div className="mt-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-5xl font-serif text-ink tracking-tight">
                Live Venue & Maintenance Schedules
              </h1>
              <p className="text-stone text-base mt-2 max-w-2xl">
                Inspect confirmed bookings and active facility maintenance windows across Bengaluru halls to identify open dates.
              </p>
            </div>

            {/* Hall Filter Select */}
            <div className="flex items-center gap-3">
              <label htmlFor="hall-select" className="text-xs font-semibold text-stone uppercase tracking-wider">
                Venue:
              </label>
              <select
                id="hall-select"
                value={selectedHallId}
                onChange={(e) => setSelectedHallId(e.target.value)}
                className="input py-2 text-xs font-medium cursor-pointer"
              >
                <option value="all">All 5 Bengaluru Halls</option>
                {halls.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page mt-10">
        {/* Status Legend */}
        <div className="card p-4 mb-8 flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-success ring-2 ring-success/20" />
              <span className="text-ink">Confirmed Booking (Slot Reserved)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-warning ring-2 ring-warning/20" />
              <span className="text-ink">Maintenance Blackout (Hall Closed)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sand border border-line" />
              <span className="text-stone">Open Date</span>
            </div>
          </div>

          {selectedHall && (
            <Link to={`/halls/${selectedHall.id}`} className="text-forest hover:underline font-semibold flex items-center gap-1">
              <span>View {selectedHall.name} specs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Month Calendar Card */}
        <div className="card overflow-hidden shadow-[var(--shadow-lift)]">
          {/* Calendar Toolbar */}
          <div className="p-6 flex items-center justify-between border-b border-line bg-paper">
            <h2 className="text-2xl font-serif text-ink flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-forest" />
              <span>{monthNames[currentMonth]} {currentYear}</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-ivory text-ink hover:bg-sand transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-ivory text-ink hover:bg-sand transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-line bg-sand/40 text-center text-xs font-semibold uppercase tracking-[0.12em] text-stone py-3.5">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-line bg-line">
            {/* Blank leading days */}
            {[...Array(firstDayIndex)].map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[115px] p-2 bg-ivory/50" />
            ))}

            {/* Days of current month */}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

              // Find approved bookings for this day
              const dayBookings = bookings.filter((b) => {
                if (b.status !== 'Approved') return false;
                if (b.eventDate !== dateString) return false;
                if (selectedHallId !== 'all' && b.hallId !== selectedHallId) return false;
                return true;
              });

              // Find active maintenance for this day
              const dayMaintenance = maintenance.filter((m) => {
                if (m.status !== 'Scheduled' && m.status !== 'In Progress') return false;
                if (dateString < m.startDate || dateString > m.endDate) return false;
                if (selectedHallId !== 'all' && m.hallId !== selectedHallId) return false;
                return true;
              });

              const isFree = dayBookings.length === 0 && dayMaintenance.length === 0;

              return (
                <div
                  key={`day-${day}`}
                  className="min-h-[115px] p-2.5 bg-paper hover:bg-ivory/80 transition-colors flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif font-bold text-ink">{day}</span>
                    {isFree && (
                      <span className="text-[10px] text-stone/70 uppercase tracking-wider font-medium">Free</span>
                    )}
                  </div>

                  {/* Day Event Chips */}
                  <div className="space-y-1.5 mt-2">
                    {/* Maintenance Blackouts */}
                    {dayMaintenance.map((m) => {
                      const hallObj = halls.find((h) => h.id === m.hallId);
                      return (
                        <div
                          key={m.id}
                          className="p-1.5 rounded-lg text-[10px] bg-warning/10 text-warning border border-warning/25 leading-tight"
                          title={`Closed for maintenance: ${m.description}`}
                        >
                          <div className="flex items-center gap-1 font-bold">
                            <Wrench className="w-2.5 h-2.5 text-warning shrink-0" />
                            <span className="truncate">Maintenance</span>
                          </div>
                          <p className="truncate text-ink/70 mt-0.5">{hallObj ? hallObj.name.split(' ')[0] : 'Venue'}</p>
                        </div>
                      );
                    })}

                    {/* Approved Bookings */}
                    {dayBookings.map((b) => {
                      const hallObj = halls.find((h) => h.id === b.hallId);
                      return (
                        <div
                          key={b.id}
                          className="p-1.5 rounded-lg text-[10px] bg-success/10 text-success border border-success/25 leading-tight"
                          title={`${b.eventType} (${formatTime(b.startTime)}–${formatTime(b.endTime)})`}
                        >
                          <div className="flex items-center gap-1 font-bold">
                            <ShieldCheck className="w-2.5 h-2.5 text-success shrink-0" />
                            <span className="truncate">{b.eventType}</span>
                          </div>
                          <p className="truncate text-ink/70 mt-0.5">{hallObj ? hallObj.name.split(' ')[0] : 'Venue'}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div />
                </div>
              );
            })}
          </div>
        </div>

        {/* Informative Guarantee Card */}
        <div className="mt-10 card p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest text-gold shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-xl text-ink">Automated Collision Prevention</h3>
              <p className="text-sm text-stone mt-1 max-w-xl">
                The platform algorithmically prevents overlapping bookings and automatically closes booking availability during scheduled facility maintenance windows.
              </p>
            </div>
          </div>
          <Link to="/halls" className="btn btn-primary whitespace-nowrap">
            <span>Explore Available Halls</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
