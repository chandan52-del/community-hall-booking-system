import React, { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PageLoader } from '../components/ui';

/**
 * Scroll behaviour for a single-page app:
 *  - "/#how-it-works" style links scroll smoothly to that section
 *  - any other navigation starts at the top of the new page
 */
export const useScrollManager = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      // wait a frame so the target page has rendered
      const t = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
      return () => window.clearTimeout(t);
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
};

export const PublicLayout: React.FC = () => {
  const { pathname } = useLocation();
  useScrollManager();

  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-forest focus:px-4 focus:py-2 focus:text-ivory">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        {/* Keyed by path: each new page fades in gently */}
        <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};
