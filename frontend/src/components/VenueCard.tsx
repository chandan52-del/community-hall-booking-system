import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, MapPin, Users } from 'lucide-react';
import type { Hall } from '../types/hall';
import { cn, formatINR } from '../lib/utils';

interface VenueCardProps {
  hall: Hall;
  size?: 'default' | 'large';
  /** Optional availability note, e.g. when the visitor searched for a date */
  availability?: { available: boolean; note: string } | null;
}

export const VenueCard: React.FC<VenueCardProps> = ({ hall, size = 'default', availability }) => (
  <motion.article
    layout
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    className="group flex h-full flex-col"
  >
    <Link to={`/halls/${hall.id}`} className="relative block overflow-hidden rounded-2xl bg-sand" aria-label={`View ${hall.name}`}>
      <div className={cn('overflow-hidden', size === 'large' ? 'aspect-[16/10]' : 'aspect-[4/3]')}>
        <img
          src={hall.images.primary}
          alt={`${hall.name}, ${hall.location.area}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent" />
      <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-ivory/95 px-3 py-1.5 text-xs font-medium text-ink">
        <MapPin className="h-3.5 w-3.5 text-moss" /> {hall.location.area}
      </span>
      {availability && (
        <span
          className={cn(
            'absolute right-4 top-4 rounded-full px-3 py-1.5 text-xs font-medium',
            availability.available ? 'bg-success text-white' : 'bg-ivory/95 text-danger',
          )}
        >
          {availability.note}
        </span>
      )}
      <span className="absolute bottom-4 right-4 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-ivory text-forest opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
        <ArrowUpRight className="h-4 w-4" />
      </span>
    </Link>

    <div className="flex flex-1 flex-col pt-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className={cn('transition-colors group-hover:text-forest', size === 'large' ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl')}>
          <Link to={`/halls/${hall.id}`}>{hall.name}</Link>
        </h3>
      </div>
      <p className="mt-1.5 text-sm text-stone">{hall.tagline}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink">
        <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-moss" /> Up to {hall.capacity.seated.toLocaleString('en-IN')} seated</span>
        <span className="text-stone">{hall.amenities.slice(0, 3).map((a) => a.name).join(' · ')}</span>
      </div>

      <div className="mt-auto flex items-end justify-between gap-4 border-t border-line pt-4 mt-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-stone">From · demo pricing</p>
          <p className="mt-1 font-serif text-xl text-ink">
            {formatINR(hall.pricing.baseRatePerDay)} <span className="font-sans text-sm text-stone">/ day</span>
          </p>
        </div>
        <Link to={`/halls/${hall.id}`} className="btn btn-outline btn-sm">View details</Link>
      </div>
    </div>
  </motion.article>
);
