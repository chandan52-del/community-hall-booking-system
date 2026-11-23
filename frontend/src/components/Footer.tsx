import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Logo } from './ui';
import { useData } from '../contexts/DataContext';

export const Footer: React.FC = () => {
  const { halls } = useData();

  return (
    <footer id="contact" className="bg-forest text-ivory/80">
      <div className="container-page py-20">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Logo tone="light" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-ivory/65">
              A booking and management platform for community halls across Bengaluru — discover spaces, check availability and
              request bookings with confidence.
            </p>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold">Explore</h4>
            <ul className="mt-5 space-y-3 text-sm">
              <li><Link to="/halls" className="hover:text-ivory">All venues</Link></li>
              <li><Link to="/calendar" className="hover:text-ivory">Availability</Link></li>
              <li><Link to="/#how-it-works" className="hover:text-ivory">How it works</Link></li>
              <li><Link to="/register" className="hover:text-ivory">Create account</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold">Venues</h4>
            <ul className="mt-5 space-y-3 text-sm">
              {halls.map((h) => (
                <li key={h.id}>
                  <Link to={`/halls/${h.id}`} className="hover:text-ivory">{h.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold">Contact</h4>
            <ul className="mt-5 space-y-4 text-sm">
              <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> Bengaluru, Karnataka</li>
              <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> <span className="break-all">hello@sabhahalls.example</span></li>
              <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> Demo contact — not a real line</li>
            </ul>
            <div className="mt-6 flex gap-3">
              <Link to="/customer" className="text-sm underline decoration-gold/60 underline-offset-4 hover:text-ivory">Customer portal</Link>
              <span className="text-ivory/30">·</span>
              <Link to="/admin" className="text-sm underline decoration-gold/60 underline-offset-4 hover:text-ivory">Admin</Link>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-ivory/15 pt-8 text-xs text-ivory/50 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Sabhā Halls — Community Hall Booking and Management System.</p>
          <p>Venue details and pricing are demonstration values. Portfolio project.</p>
        </div>
      </div>
    </footer>
  );
};
