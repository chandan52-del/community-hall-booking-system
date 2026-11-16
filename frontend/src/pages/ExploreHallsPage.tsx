import React, { useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Search, SlidersHorizontal, X } from 'lucide-react';
import { AREAS, EVENT_CATEGORIES, FACILITY_FILTERS, hallHasFacility, hallMatchesCategory } from '../data/hallsData';
import { useData } from '../contexts/DataContext';
import { VenueCard } from '../components/VenueCard';
import { DemoNotice, EmptyState } from '../components/ui';
import { cn, formatDate, formatINR, maintenanceOn, todayIST } from '../lib/utils';

type SortKey = 'recommended' | 'price_asc' | 'price_desc' | 'capacity_desc';
const PRICE_CEILING = 400000;

const ExploreInner: React.FC = () => {
  const [params] = useSearchParams();
  const { halls, bookings, maintenance } = useData();

  const [query, setQuery] = useState('');
  const [areas, setAreas] = useState<string[]>(params.get('area') ? [params.get('area')!] : []);
  const [category, setCategory] = useState(params.get('type') ?? '');
  const [guests, setGuests] = useState(params.get('guests') ?? '');
  const [date, setDate] = useState(params.get('date') ?? '');
  const [facilities, setFacilities] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(PRICE_CEILING);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState<SortKey>('recommended');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggle = (list: string[], value: string, set: (v: string[]) => void) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  /** Availability on the chosen date: maintenance closes a hall; approved bookings are listed. */
  const availabilityFor = (hallId: string) => {
    if (!date) return null;
    if (maintenanceOn(hallId, date, maintenance)) return { available: false, note: 'Closed for maintenance' };
    const taken = bookings.filter((b) => b.hallId === hallId && b.eventDate === date && b.status === 'Approved').length;
    return taken ? { available: false, note: `${taken} booking${taken > 1 ? 's' : ''} that day` } : { available: true, note: `Available ${formatDate(date, { day: 'numeric', month: 'short' })}` };
  };

  const results = useMemo(() => {
    const guestCount = Number(guests) || 0;
    const q = query.trim().toLowerCase();
    const list = halls.filter((h) => {
      if (!h.isActive) return false;
      if (q && !`${h.name} ${h.location.area} ${h.tagline}`.toLowerCase().includes(q)) return false;
      if (areas.length && !areas.includes(h.location.area)) return false;
      if (category && !hallMatchesCategory(h, category)) return false;
      if (guestCount && Math.max(h.capacity.seated, h.capacity.floating) < guestCount) return false;
      if (h.pricing.baseRatePerDay > maxPrice) return false;
      if (facilities.some((f) => !hallHasFacility(h, f))) return false;
      if (onlyAvailable && date && !availabilityFor(h.id)?.available) return false;
      return true;
    });
    const sorters: Record<SortKey, (a: typeof list[0], b: typeof list[0]) => number> = {
      recommended: (a, b) => Number(b.isFeatured) - Number(a.isFeatured),
      price_asc: (a, b) => a.pricing.baseRatePerDay - b.pricing.baseRatePerDay,
      price_desc: (a, b) => b.pricing.baseRatePerDay - a.pricing.baseRatePerDay,
      capacity_desc: (a, b) => b.capacity.seated - a.capacity.seated,
    };
    return [...list].sort(sorters[sort]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [halls, bookings, maintenance, query, areas, category, guests, date, facilities, maxPrice, onlyAvailable, sort]);

  const activeCount = [query, category, guests, date].filter(Boolean).length + areas.length + facilities.length + (maxPrice < PRICE_CEILING ? 1 : 0);

  const reset = () => {
    setQuery(''); setAreas([]); setCategory(''); setGuests(''); setDate('');
    setFacilities([]); setMaxPrice(PRICE_CEILING); setOnlyAvailable(false); setSort('recommended');
  };

  const filterPanel = (
    <div className="space-y-8">
      <div>
        <label htmlFor="f-q" className="label">Venue name</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
          <input id="f-q" className="input pl-9" placeholder="Search venues…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <fieldset>
        <legend className="label">Location</legend>
        <div className="flex flex-wrap gap-2">
          {AREAS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggle(areas, a, setAreas)}
              aria-pressed={areas.includes(a)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                areas.includes(a) ? 'border-forest bg-forest text-ivory' : 'border-line bg-paper text-ink hover:border-stone',
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="f-guests" className="label">Guests</label>
          <input id="f-guests" type="number" min={1} className="input" placeholder="Any" value={guests} onChange={(e) => setGuests(e.target.value)} />
        </div>
        <div>
          <label htmlFor="f-date" className="label">Event date</label>
          <input id="f-date" type="date" min={todayIST()} className="input px-2.5" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      {date && (
        <label className="-mt-4 flex items-center gap-2.5 text-sm text-ink">
          <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} className="h-4 w-4" />
          Only show venues available on this date
        </label>
      )}

      <div>
        <label htmlFor="f-cat" className="label">Event type</label>
        <select id="f-cat" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Any occasion</option>
          {EVENT_CATEGORIES.map((c) => <option key={c.label}>{c.label}</option>)}
        </select>
      </div>

      <fieldset>
        <legend className="label">Facilities</legend>
        <div className="space-y-2.5">
          {FACILITY_FILTERS.map((f) => (
            <label key={f.key} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
              <input type="checkbox" className="h-4 w-4" checked={facilities.includes(f.key)} onChange={() => toggle(facilities, f.key, setFacilities)} />
              {f.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="f-price" className="label">Max price per day</label>
          <span className="text-sm font-medium text-ink">{maxPrice >= PRICE_CEILING ? 'Any' : formatINR(maxPrice)}</span>
        </div>
        <input id="f-price" type="range" min={30000} max={PRICE_CEILING} step={10000} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full" />
        <div className="mt-1 flex justify-between text-xs text-stone"><span>₹30k</span><span>₹4L+</span></div>
      </div>

      <button type="button" onClick={reset} className="btn btn-ghost btn-sm w-full border border-line">Clear all filters</button>
    </div>
  );

  return (
    <div className="pb-24">
      {/* Page header */}
      <section className="border-b border-line bg-paper">
        <div className="container-page py-14 md:py-20">
          <span className="eyebrow">Explore venues</span>
          <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h1 className="max-w-2xl text-4xl md:text-6xl">Community halls &amp; event venues in Bengaluru</h1>
            <Link to="/calendar" className="btn btn-outline self-start"><CalendarDays className="h-4 w-4" /> View availability calendar</Link>
          </div>
        </div>
      </section>

      <div className="container-page mt-10 grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-14">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-28">
            <h2 className="mb-6 font-sans text-sm font-semibold uppercase tracking-[0.14em] text-ink">Refine</h2>
            {filterPanel}
          </div>
        </aside>

        <div>
          {/* Toolbar */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
            <p className="text-sm text-stone" aria-live="polite">
              <span className="font-medium text-ink">{results.length}</span> {results.length === 1 ? 'venue' : 'venues'}
              {date && <> · availability for <span className="text-ink">{formatDate(date)}</span></>}
            </p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setFiltersOpen(true)} className="btn btn-outline btn-sm lg:hidden">
                <SlidersHorizontal className="h-4 w-4" /> Filters{activeCount > 0 && ` (${activeCount})`}
              </button>
              <label htmlFor="sort" className="sr-only">Sort venues</label>
              <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="input w-auto py-2 text-sm">
                <option value="recommended">Recommended</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="capacity_desc">Largest capacity</option>
              </select>
            </div>
          </div>

          {results.length === 0 ? (
            <EmptyState
              icon={<Search className="h-6 w-6" />}
              title="No venues match these filters"
              description="Try a different neighbourhood, fewer facilities or a higher price limit."
              action={<button onClick={reset} className="btn btn-primary btn-sm">Clear filters</button>}
            />
          ) : (
            <motion.div layout className="grid gap-x-8 gap-y-14 md:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {results.map((h) => <VenueCard key={h.id} hall={h} availability={availabilityFor(h.id)} />)}
              </AnimatePresence>
            </motion.div>
          )}

          <DemoNotice className="mt-16" />
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {filtersOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-ink/40" onClick={() => setFiltersOpen(false)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 right-0 w-full max-w-sm overflow-y-auto bg-ivory p-6"
            >
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-2xl">Filters</h2>
                <button onClick={() => setFiltersOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full border border-line" aria-label="Close filters"><X className="h-4 w-4" /></button>
              </div>
              {filterPanel}
              <button onClick={() => setFiltersOpen(false)} className="btn btn-primary mt-6 w-full">Show {results.length} venues</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/** Re-mount when the URL query changes so a new hero search re-seeds the filters. */
export const ExploreHallsPage: React.FC = () => {
  const { search } = useLocation();
  return <ExploreInner key={search} />;
};

export default ExploreHallsPage;
