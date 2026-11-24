import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Car, CalendarCheck2, Check, Layers, ShieldCheck, Sparkles, Utensils, Volume2, Wind, Wrench, Zap } from 'lucide-react';
import { Reveal, SectionHeading } from './ui';
import { VenueCard } from './VenueCard';
import { useData } from '../contexts/DataContext';

/* =================================================================
   FEATURED VENUES — editorial grid: one hero card + four standard
================================================================= */
export const FeaturedVenuesSection: React.FC = () => {
  const { halls } = useData();
  const active = halls.filter((h) => h.isActive);

  return (
    <section className="py-24 md:py-32">
      <div className="container-page">
        <SectionHeading
          eyebrow="Featured venues"
          title={<>Five distinctive spaces <br className="hidden md:block" />across the city</>}
          description="From a violin-shaped concert hall in Malleshwaram to expansive grounds at Palace Grounds — each venue suited to a different kind of occasion."
          action={<Link to="/halls" className="btn btn-outline self-start md:self-auto">View all venues <ArrowRight className="h-4 w-4" /></Link>}
        />
        <div className="grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
          {active.map((hall, i) => (
            <Reveal key={hall.id} delay={(i % 3) * 0.08} className={i === 0 ? 'lg:col-span-2' : ''}>
              <VenueCard hall={hall} size={i === 0 ? 'large' : 'default'} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

/* =================================================================
   HOW IT WORKS — four numbered steps with serif numerals
================================================================= */
const STEPS = [
  { title: 'Discover', text: 'Browse venues by neighbourhood, guest count, occasion and facilities.' },
  { title: 'Check availability', text: 'See confirmed bookings and maintenance closures before you request a date.' },
  { title: 'Request your date', text: 'Send your event details, timings and requirements in a single form.' },
  { title: 'Get confirmed', text: 'The venue reviews your request; track its status from your dashboard.' },
];

export const HowItWorksSection: React.FC = () => (
  <section id="how-it-works" className="scroll-mt-24 bg-paper py-24 md:py-32">
    <div className="container-page">
      <SectionHeading eyebrow="How it works" title="From first look to confirmed booking" align="center"
        description="A clear, four-step process — no phone tag, no double bookings." />
      <ol className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {STEPS.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.08}>
            <li className="relative border-t border-line pt-8">
              <span className="absolute -top-px left-0 h-px w-12 bg-gold" />
              <span className="font-serif text-5xl italic text-gold">0{i + 1}</span>
              <h3 className="mt-5 text-2xl">{s.title}</h3>
              <p className="mt-3 text-stone">{s.text}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </div>
  </section>
);

/* =================================================================
   WHY CHOOSE US — split image / benefits
================================================================= */
const BENEFITS = [
  { icon: CalendarCheck2, title: 'No double bookings', text: 'A date can only be approved once. Overlapping requests are flagged before approval.' },
  { icon: Wrench, title: 'Maintenance-aware calendar', text: 'Scheduled maintenance automatically closes a venue for the affected dates.' },
  { icon: ShieldCheck, title: 'A clear record of every booking', text: 'Requests, approvals and cancellations are kept in your booking history.' },
];

export const WhyChooseUsSection: React.FC = () => (
  <section className="py-24 md:py-32">
    <div className="container-page grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
      <Reveal className="relative">
        <div className="overflow-hidden rounded-t-[10rem] rounded-b-2xl">
          <img
            src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=80"
            alt="An elegantly prepared banquet hall with round tables"
            loading="lazy"
            className="aspect-[4/5] w-full object-cover"
          />
        </div>
        <div className="absolute -right-4 bottom-10 hidden max-w-[220px] rounded-2xl bg-forest p-6 text-ivory shadow-[var(--shadow-lift)] md:block">
          <p className="font-serif text-4xl text-gold">1</p>
          <p className="mt-2 text-sm text-ivory/80">place to request, track and manage every booking.</p>
        </div>
      </Reveal>

      <div>
        <span className="eyebrow">Why choose us</span>
        <h2 className="mt-4 text-3xl md:text-[2.75rem]">Booking a hall should feel as considered as the event itself</h2>
        <p className="mt-5 text-lg text-stone">We bring venue discovery, availability and booking management together so organisers and administrators work from the same, reliable information.</p>
        <ul className="mt-10 space-y-8">
          {BENEFITS.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 0.08}>
              <li className="flex gap-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line bg-paper text-forest"><Icon className="h-5 w-5" /></span>
                <div>
                  <h3 className="font-sans text-base font-semibold">{title}</h3>
                  <p className="mt-1 text-stone">{text}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

/* =================================================================
   FEATURED FACILITIES — quiet icon grid on sand
================================================================= */
const FACILITIES = [
  { icon: Wind, label: 'Air conditioning' },
  { icon: Volume2, label: 'Sound & AV' },
  { icon: Layers, label: 'Stages' },
  { icon: Utensils, label: 'Dining areas' },
  { icon: Car, label: 'Parking' },
  { icon: Zap, label: 'Power backup' },
  { icon: Sparkles, label: 'Bridal & green rooms' },
  { icon: Check, label: 'Flexible layouts' },
];

export const FacilitiesSection: React.FC = () => (
  <section className="bg-sand/60 py-24 md:py-28">
    <div className="container-page">
      <SectionHeading eyebrow="Featured facilities" title="Everything an occasion needs" align="center"
        description="Filter venues by the facilities that matter to your event." />
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
        {FACILITIES.map(({ icon: Icon, label }) => (
          <Link key={label} to="/halls" className="group flex flex-col items-center gap-4 bg-ivory px-6 py-10 text-center transition-colors hover:bg-paper">
            <Icon className="h-6 w-6 text-moss transition-transform duration-500 group-hover:-translate-y-1" strokeWidth={1.5} />
            <span className="text-sm font-medium text-ink">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

/* =================================================================
   TESTIMONIALS — clearly labelled demonstration content
================================================================= */
const TESTIMONIALS = [
  { quote: 'Seeing which dates were already taken saved us days of calls. We had a confirmed hall within a day of requesting it.', name: 'Ananya R.', role: 'Seminar organiser' },
  { quote: 'The booking history made it easy to show our committee exactly what had been approved and when.', name: 'Rajesh H.', role: 'Cultural association secretary' },
  { quote: 'Clear timings, clear status. For a family function with 200 guests, that peace of mind matters.', name: 'Preeti S.', role: 'Family event host' },
];

export const TestimonialsSection: React.FC = () => (
  <section className="py-24 md:py-32">
    <div className="container-page">
      <SectionHeading eyebrow="Kind words" title="What organisers tell us" align="center"
        description="Sample testimonials for demonstration purposes." />
      <div className="grid gap-8 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.08}>
            <figure className="card flex h-full flex-col p-8">
              <span className="font-serif text-6xl leading-none text-gold" aria-hidden>“</span>
              <blockquote className="mt-2 flex-1 font-serif text-xl leading-relaxed text-ink">{t.quote}</blockquote>
              <figcaption className="mt-8 border-t border-line pt-5">
                <p className="font-medium text-ink">{t.name}</p>
                <p className="text-sm text-stone">{t.role} · <span className="italic">demo</span></p>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

/* =================================================================
   CALL TO ACTION — forest band with photography
================================================================= */
export const CallToActionSection: React.FC = () => (
  <section className="pb-24 md:pb-32">
    <div className="container-page">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-forest">
          <img
            src="https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1800&q=70"
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-luminosity"
          />
          <div className="relative grid gap-10 px-8 py-16 md:grid-cols-5 md:items-center md:px-16 md:py-20">
            <div className="md:col-span-3">
              <span className="eyebrow text-gold">Plan your event</span>
              <h2 className="mt-4 text-3xl text-ivory md:text-5xl">Your occasion deserves the right room.</h2>
              <p className="mt-4 max-w-lg text-ivory/75">Explore the venues, compare spaces and send a booking request in minutes.</p>
            </div>
            <div className="flex flex-wrap gap-3 md:col-span-2 md:justify-end">
              <Link to="/halls" className="btn btn-gold">Explore venues <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/register" className="btn border border-ivory/40 text-ivory hover:bg-ivory hover:text-forest">Create account</Link>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);
