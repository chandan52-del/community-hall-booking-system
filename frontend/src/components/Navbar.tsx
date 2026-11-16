import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Logo } from './ui';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Explore Venues', to: '/halls' },
  { label: 'Availability', to: '/calendar' },
  { label: 'How It Works', to: '/#how-it-works' },
  { label: 'Contact', to: '/#contact' },
];

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu whenever the route changes
  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  const isActive = (to: string) => {
    if (to.includes('#')) return location.pathname === '/' && location.hash === to.slice(1);
    if (to === '/') return location.pathname === '/' && !location.hash;
    return location.pathname.startsWith(to);
  };

  const portal = user ? { label: user.role === 'admin' ? 'Admin Console' : 'My Bookings', to: user.role === 'admin' ? '/admin' : '/customer' } : null;

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b bg-ivory/90 backdrop-blur-md transition-[border-color,box-shadow] duration-300',
        scrolled ? 'border-line shadow-[0_1px_0_rgba(0,0,0,0.02)]' : 'border-transparent',
      )}
    >
      <div className="container-page flex h-20 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className={cn(
                'relative px-4 py-2 text-sm font-medium transition-colors',
                isActive(link.to) ? 'text-forest' : 'text-stone hover:text-ink',
              )}
            >
              {link.label}
              {isActive(link.to) && (
                <motion.span layoutId="nav-underline" className="absolute inset-x-4 -bottom-0.5 h-px bg-gold" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {portal ? (
            <Link to={portal.to} className="btn btn-ghost btn-sm">{portal.label}</Link>
          ) : (
            <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
          )}
          <Link to="/halls" className="btn btn-primary btn-sm">
            Explore Venues <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-line bg-ivory lg:hidden"
          >
            <nav className="container-page flex flex-col py-4" aria-label="Mobile">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className={cn('border-b border-line py-4 font-serif text-xl', isActive(link.to) ? 'text-forest' : 'text-ink')}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Link to={portal?.to ?? '/login'} className="btn btn-outline">{portal?.label ?? 'Log in'}</Link>
                <Link to="/halls" className="btn btn-primary">Explore</Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
