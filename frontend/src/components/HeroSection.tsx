import React, { Suspense, lazy, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, MapPin, Search, Sparkles, Users, Move3d } from 'lucide-react';
import { AREAS, EVENT_CATEGORIES } from '../data/hallsData';
import { todayIST } from '../lib/utils';

// The 3D scene (and the whole three.js library) is downloaded as a separate chunk,
// so the headline and search panel appear instantly while the model loads.
const CommunityHallScene = lazy(() => import('../three/CommunityHallScene'));

const ease = [0.22, 1, 0.36, 1] as const;

/** One labelled cell of the search bar (module-level so inputs keep focus while typing). */
const Field: React.FC<{ icon: React.ReactNode; label: string; htmlFor: string; children: React.ReactNode }> = ({ icon, label, htmlFor, children }) => (
  <div className="flex flex-1 items-start gap-3 px-5 py-4 md:py-3">
    <span className="mt-1 text-moss">{icon}</span>
    <div className="min-w-0 flex-1">
      <label htmlFor={htmlFor} className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone">{label}</label>
      {children}
    </div>
  </div>
);

export const SearchPanel: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const navigate = useNavigate();
  const [area, setArea] = useState('');
  const [type, setType] = useState('');
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (area) params.set('area', area);
    if (type) params.set('type', type);
    if (date) params.set('date', date);
    if (guests) params.set('guests', guests);
    navigate(`/halls${params.toString() ? `?${params}` : ''}`);
  };

  const control = 'mt-1 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-[#a6a69c]';

  return (
    <form
      onSubmit={submit}
      className={`card flex flex-col divide-y divide-line shadow-[var(--shadow-lift)] md:flex-row md:items-center md:divide-x md:divide-y-0 ${compact ? '' : 'md:p-2'}`}
      aria-label="Search venues"
    >
      <Field icon={<MapPin className="h-4 w-4" />} label="Location" htmlFor="s-area">
        <select id="s-area" value={area} onChange={(e) => setArea(e.target.value)} className={`${control} cursor-pointer`}>
          <option value="">Anywhere in Bengaluru</option>
          {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </Field>
      <Field icon={<Sparkles className="h-4 w-4" />} label="Event type" htmlFor="s-type">
        <select id="s-type" value={type} onChange={(e) => setType(e.target.value)} className={`${control} cursor-pointer`}>
          <option value="">Any occasion</option>
          {EVENT_CATEGORIES.map((c) => <option key={c.label} value={c.label}>{c.label}</option>)}
        </select>
      </Field>
      <Field icon={<CalendarDays className="h-4 w-4" />} label="Event date" htmlFor="s-date">
        <input id="s-date" type="date" min={todayIST()} value={date} onChange={(e) => setDate(e.target.value)} className={control} />
      </Field>
      <Field icon={<Users className="h-4 w-4" />} label="Guests" htmlFor="s-guests">
        <input id="s-guests" type="number" min={1} inputMode="numeric" placeholder="e.g. 300" value={guests} onChange={(e) => setGuests(e.target.value)} className={control} />
      </Field>
      <div className="p-3 md:pl-3">
        <button type="submit" className="btn btn-primary w-full md:h-14 md:w-auto md:px-7">
          <Search className="h-4 w-4" /> Search
        </button>
      </div>
    </form>
  );
};

export const HeroSection: React.FC = () => (
  <section className="relative overflow-hidden pb-16 pt-10 md:pb-24 md:pt-14">
    <div className="container-page">
      <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
        {/* Editorial copy */}
        <div className="lg:col-span-6 lg:pr-6">
          <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="eyebrow">
            Community halls · Bengaluru
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease }}
            className="mt-6 text-[2.75rem] leading-[1.05] sm:text-6xl xl:text-[4.6rem]"
          >
            Find the perfect space for your <em className="font-medium text-forest">special moments.</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.16, ease }}
            className="mt-6 max-w-lg text-lg text-stone"
          >
            Discover beautiful community halls and event venues across Bengaluru. Explore spaces, check availability and book with confidence.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.24, ease }} className="mt-9 flex flex-wrap gap-3">
            <Link to="/halls" className="btn btn-primary">
              Explore venues <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/#how-it-works" className="btn btn-outline">Discover how it works</Link>
          </motion.div>

          <motion.dl initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-6">
            {[
              ['5', 'Curated venues'],
              ['5', 'Neighbourhoods'],
              ['24h', 'Typical review time'],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="font-serif text-3xl text-forest">{v}</dd>
                <dd className="mt-1 text-xs text-stone">{l}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* Architectural 3D view inside an arch — a recurring brand motif */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1, delay: 0.1, ease }} className="relative lg:col-span-6">
          <div className="relative h-[440px] overflow-hidden rounded-b-3xl rounded-t-[12rem] border border-line shadow-[var(--shadow-lift)] sm:h-[540px] lg:h-[620px] lg:rounded-t-[16rem]">
            <Suspense fallback={<div className="skeleton h-full w-full rounded-none" />}>
              <CommunityHallScene />
            </Suspense>
          </div>

          <div className="pointer-events-none absolute -bottom-6 left-4 flex items-center gap-3 rounded-2xl border border-line bg-paper/95 py-3 pl-3 pr-5 shadow-[var(--shadow-soft)] backdrop-blur sm:left-8">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-gold"><Move3d className="h-4 w-4" /></span>
            <div>
              <p className="text-sm font-medium text-ink">Drag to explore</p>
              <p className="text-xs text-stone">Interactive architectural view</p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.35, ease }} className="mt-16 md:mt-20">
        <SearchPanel />
      </motion.div>
    </div>
  </section>
);
