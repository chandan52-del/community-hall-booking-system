import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Info, Inbox } from 'lucide-react';
import type { BookingStatus, MaintenanceStatus } from '../../types/booking';
import { cn } from '../../lib/utils';

/* ---------------------------------------------------------------
   Logo — a simple arch monogram; arches recur across the brand.
---------------------------------------------------------------- */
export const Logo: React.FC<{ tone?: 'dark' | 'light'; to?: string }> = ({ tone = 'dark', to = '/' }) => (
  <Link to={to} className="group inline-flex items-center gap-3" aria-label="Sabhā Halls home">
    <span
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-t-full rounded-b-md border transition-colors',
        tone === 'dark' ? 'border-forest bg-forest text-gold' : 'border-gold/60 bg-transparent text-gold',
      )}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M5 21V11a7 7 0 0 1 14 0v10" />
        <path d="M9 21v-7a3 3 0 0 1 6 0v7" />
      </svg>
    </span>
    <span className="leading-none">
      <span className={cn('block font-serif text-xl font-semibold tracking-tight', tone === 'dark' ? 'text-forest' : 'text-ivory')}>
        Sabhā Halls
      </span>
      <span className={cn('mt-1 block text-[10px] font-medium uppercase tracking-[0.22em]', tone === 'dark' ? 'text-stone' : 'text-ivory/60')}>
        Bengaluru
      </span>
    </span>
  </Link>
);

/* ---------------------------------------------------------------
   Reveal — subtle fade-up when an element scrolls into view.
   Respects the OS "reduce motion" setting automatically.
---------------------------------------------------------------- */
export const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

/* ---------------------------------------------------------------
   Section heading used across marketing pages
---------------------------------------------------------------- */
export const SectionHeading: React.FC<{
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  align?: 'left' | 'center';
  action?: React.ReactNode;
}> = ({ eyebrow, title, description, align = 'left', action }) => (
  <div className={cn('mb-12 flex flex-col gap-6 md:mb-16', align === 'center' ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between')}>
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="mt-4 text-3xl md:text-[2.75rem]">{title}</h2>
      {description && <p className="mt-4 text-base text-stone md:text-lg">{description}</p>}
    </div>
    {action}
  </div>
);

/* ---------------------------------------------------------------
   Status badges — colour + text (never colour alone, for accessibility)
---------------------------------------------------------------- */
const STATUS_STYLES: Record<BookingStatus | MaintenanceStatus, string> = {
  Pending: 'bg-warning/10 text-warning ring-warning/25',
  Approved: 'bg-success/10 text-success ring-success/25',
  Rejected: 'bg-danger/10 text-danger ring-danger/25',
  Cancelled: 'bg-sand text-stone ring-line',
  Completed: 'bg-forest/10 text-forest ring-forest/20',
  Scheduled: 'bg-warning/10 text-warning ring-warning/25',
  'In Progress': 'bg-moss/10 text-moss ring-moss/25',
};

export const StatusBadge: React.FC<{ status: BookingStatus | MaintenanceStatus; className?: string }> = ({ status, className }) => (
  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset', STATUS_STYLES[status], className)}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
    {status}
  </span>
);

/* ---------------------------------------------------------------
   Empty state
---------------------------------------------------------------- */
export const EmptyState: React.FC<{ title: string; description?: string; action?: React.ReactNode; icon?: React.ReactNode }> = ({
  title, description, action, icon,
}) => (
  <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-sand text-moss">{icon ?? <Inbox className="h-6 w-6" />}</div>
    <h3 className="text-xl">{title}</h3>
    {description && <p className="mt-2 max-w-sm text-sm text-stone">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

/* ---------------------------------------------------------------
   Demo-data notice — keeps the project honest about sample values
---------------------------------------------------------------- */
export const DemoNotice: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('flex items-start gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ink', className)}>
    <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
    <p>
      {children ?? (
        <>
          <strong className="font-medium">Demonstration values.</strong> Capacities, facilities and prices shown are sample data for this
          project and can be edited by an administrator. Please confirm details directly with the venue.
        </>
      )}
    </p>
  </div>
);

/* ---------------------------------------------------------------
   Dashboard building blocks
---------------------------------------------------------------- */
export const PageHeader: React.FC<{ eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }> = ({
  eyebrow, title, description, actions,
}) => (
  <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1 className="mt-2 text-3xl md:text-4xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-stone">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
  </div>
);

export const StatCard: React.FC<{ label: string; value: React.ReactNode; hint?: string; icon: React.ReactNode; tone?: 'forest' | 'gold' | 'success' | 'warning' | 'danger' }> = ({
  label, value, hint, icon, tone = 'forest',
}) => {
  const toneClass = {
    forest: 'bg-forest/8 text-forest',
    gold: 'bg-gold/15 text-gold-dark',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
  }[tone];
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <span className="text-sm text-stone">{label}</span>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-full', toneClass)}>{icon}</span>
      </div>
      <p className="mt-3 font-serif text-3xl text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone">{hint}</p>}
    </div>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => <div className={cn('skeleton', className)} aria-hidden />;

/** Full-page loading state used while lazy route chunks download */
export const PageLoader: React.FC = () => (
  <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
    <div className="flex flex-col items-center gap-4">
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-sand border-t-forest" />
      <span className="text-sm text-stone">Loading…</span>
    </div>
  </div>
);

/** Accessible modal dialog */
export const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }> = ({
  open, onClose, title, children, footer,
}) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="card relative z-10 w-full max-w-lg p-6 shadow-[var(--shadow-lift)] md:p-8"
      >
        <h3 className="text-2xl">{title}</h3>
        <div className="mt-5">{children}</div>
        {footer && <div className="mt-8 flex justify-end gap-3">{footer}</div>}
      </motion.div>
    </div>
  );
};
