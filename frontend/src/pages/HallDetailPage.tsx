import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Users, ShieldCheck, Check,
  Clock, ArrowLeft, ChevronRight, Sparkles, Building2,
  CalendarDays, AlertCircle
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { DemoNotice } from '../components/ui';
import { VenueCard } from '../components/VenueCard';
import { formatINR, todayIST, maintenanceOn, formatDate } from '../lib/utils';
import toast, { Toaster } from 'react-hot-toast';

export const HallDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getHall, halls, maintenance } = useData();

  const hall = getHall(id || '');

  // Gallery active image
  const [selectedImage, setSelectedImage] = useState<string>(
    hall ? hall.images.primary : ''
  );

  // Booking widget form state
  const [bookingDate, setBookingDate] = useState<string>('');
  const [eventType, setEventType] = useState<string>('');
  const [guestCount, setGuestCount] = useState<number>(hall?.capacity.seated || 300);

  if (!hall) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="w-16 h-16 rounded-full bg-sand flex items-center justify-center text-moss mb-4">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-3xl text-ink mb-2">Venue Not Found</h2>
        <p className="text-stone text-sm max-w-md mb-6">
          The requested Bengaluru hall listing could not be found or may have been deactivated.
        </p>
        <Link to="/halls" className="btn btn-primary">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Explore Halls</span>
        </Link>
      </div>
    );
  }

  // Active image fallback if state is empty
  const currentImage = selectedImage || hall.images.primary;

  // Check if chosen date has scheduled maintenance
  const isMaintenanceBlocked = bookingDate ? maintenanceOn(hall.id, bookingDate, maintenance) : null;

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDate) {
      toast.error('Please select an event date');
      return;
    }
    if (isMaintenanceBlocked) {
      toast.error(`This hall is scheduled for maintenance on ${formatDate(bookingDate)}. Please select another date.`);
      return;
    }
    // Redirect to customer portal with pre-filled query params
    const params = new URLSearchParams({
      hall: hall.id,
      date: bookingDate,
      type: eventType || hall.eventTypes[0] || 'Community Gathering',
      guests: String(guestCount),
    });
    navigate(`/customer?${params.toString()}`);
  };

  const similarHalls = halls.filter((h) => h.id !== hall.id && h.isActive).slice(0, 2);

  return (
    <div className="pb-24">
      <Toaster position="top-right" />
      {/* Breadcrumb Bar */}
      <div className="border-b border-line bg-paper/60 backdrop-blur-sm">
        <div className="container-page py-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-stone">
            <Link to="/" className="hover:text-forest transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-stone/50" />
            <Link to="/halls" className="hover:text-forest transition-colors">Explore Venues</Link>
            <ChevronRight className="w-3.5 h-3.5 text-stone/50" />
            <span className="text-ink truncate max-w-xs">{hall.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-page mt-8">
        {/* Title & Location Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-forest/10 text-forest border border-forest/15">
                <MapPin className="w-3.5 h-3.5 text-moss" />
                <span>{hall.location.area}, Bengaluru</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gold/15 text-gold-dark border border-gold/30">
                <Sparkles className="w-3.5 h-3.5 text-gold-dark" />
                <span>Verified Demonstration Venue</span>
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-ink tracking-tight">
              {hall.name}
            </h1>
            <p className="text-stone text-sm sm:text-base mt-2 flex items-center gap-1.5">
              <span>{hall.location.address}{hall.location.pincode ? `, Pincode: ${hall.location.pincode}` : ''}</span>
            </p>
          </div>

          <Link
            to="/halls"
            className="btn btn-outline btn-sm self-start lg:self-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Bengaluru Venues</span>
          </Link>
        </div>

        {/* Editorial Image Gallery */}
        <div className="space-y-3.5 mb-12">
          <div className="relative aspect-[16/9] md:aspect-[21/9] max-h-[520px] rounded-2xl overflow-hidden bg-sand border border-line shadow-[var(--shadow-soft)]">
            <img
              src={currentImage}
              alt={hall.name}
              className="w-full h-full object-cover transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent pointer-events-none" />
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-ivory/95 text-xs font-medium text-forest backdrop-blur-sm shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-moss" />
              <span>Architectural Photography (Representative)</span>
            </span>
          </div>

          {/* Thumbnails Row */}
          <div className="grid grid-cols-4 gap-3">
            {hall.images.gallery.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImage(imgUrl)}
                className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all ${
                  currentImage === imgUrl
                    ? 'border-forest ring-2 ring-forest/20 shadow-md scale-[1.01]'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
                aria-label={`View image ${idx + 1}`}
              >
                <img src={imgUrl} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Content & Sticky Booking Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Details & Amenities */}
          <div className="lg:col-span-8 space-y-10">
            {/* Overview / Description */}
            <div className="card p-7 md:p-8 space-y-4">
              <h2 className="text-2xl font-serif text-ink">About The Venue</h2>
              <p className="text-ink/80 text-base leading-relaxed">
                {hall.description}
              </p>
              <DemoNotice />
            </div>

            {/* Capacity Breakdown */}
            <div className="card p-7 md:p-8 space-y-5">
              <h2 className="text-2xl font-serif text-ink">Spatial Capacities</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-ivory border border-line text-center">
                  <Users className="w-6 h-6 text-forest mx-auto mb-2" />
                  <p className="text-3xl font-serif text-ink">{hall.capacity.seated.toLocaleString('en-IN')}</p>
                  <p className="text-xs uppercase tracking-wider text-stone font-semibold mt-1">Seated Auditorium</p>
                </div>
                <div className="p-5 rounded-xl bg-ivory border border-line text-center">
                  <Users className="w-6 h-6 text-moss mx-auto mb-2" />
                  <p className="text-3xl font-serif text-ink">{hall.capacity.floating.toLocaleString('en-IN')}</p>
                  <p className="text-xs uppercase tracking-wider text-stone font-semibold mt-1">Floating Capacity</p>
                </div>
                <div className="p-5 rounded-xl bg-ivory border border-line text-center">
                  <Users className="w-6 h-6 text-gold-dark mx-auto mb-2" />
                  <p className="text-3xl font-serif text-ink">{hall.capacity.dining ? hall.capacity.dining.toLocaleString('en-IN') : 'N/A'}</p>
                  <p className="text-xs uppercase tracking-wider text-stone font-semibold mt-1">Dining Hall Capacity</p>
                </div>
              </div>
            </div>

            {/* Facilities & Amenities */}
            <div className="card p-7 md:p-8 space-y-5">
              <h2 className="text-2xl font-serif text-ink">Facilities & Equipment</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {hall.amenities.map((amenity) => (
                  <div
                    key={amenity.id}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-ivory border border-line/60"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest/10 text-forest shrink-0">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </span>
                    <span className="text-sm font-medium text-ink">{amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Architectural Features & Guidelines */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="card p-6 space-y-3">
                <h3 className="font-serif text-xl text-ink flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold-dark" />
                  <span>Key Highlights</span>
                </h3>
                <ul className="space-y-2 text-sm text-stone">
                  {hall.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-gold-dark font-bold">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card p-6 space-y-3">
                <h3 className="font-serif text-xl text-ink flex items-center gap-2">
                  <Clock className="w-4 h-4 text-moss" />
                  <span>Venue Guidelines</span>
                </h3>
                <ul className="space-y-2 text-sm text-stone">
                  {hall.rules.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-moss font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Booking Widget */}
          <div className="lg:col-span-4">
            <div className="card p-7 sticky top-28 shadow-[var(--shadow-lift)] space-y-6">
              <div>
                <span className="text-xs uppercase tracking-wider text-stone font-semibold">Tariff Schedule</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-serif text-forest">
                    {formatINR(hall.pricing.baseRatePerDay)}
                  </span>
                  <span className="text-sm text-stone">/ day</span>
                </div>
                {hall.pricing.hourlyRate && (
                  <p className="text-xs text-moss font-medium mt-1">
                    + {formatINR(hall.pricing.hourlyRate)}/hr additional slot
                  </p>
                )}
              </div>

              <div className="space-y-2.5 pt-4 border-t border-line text-sm text-stone">
                <div className="flex justify-between">
                  <span>Cleaning & Sanitation</span>
                  <span className="font-medium text-ink">{formatINR(hall.pricing.cleaningFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Refundable Security Deposit</span>
                  <span className="font-medium text-ink">{formatINR(hall.pricing.depositRequired)}</span>
                </div>
              </div>

              {/* Instant Booking Request Form */}
              <form onSubmit={handleBookingSubmit} className="space-y-4 pt-4 border-t border-line">
                <div>
                  <label htmlFor="b-date" className="label">Event Date</label>
                  <input
                    id="b-date"
                    type="date"
                    required
                    min={todayIST()}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="input"
                  />
                  {isMaintenanceBlocked && (
                    <p className="text-xs text-danger flex items-center gap-1 mt-1.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Closed for maintenance: {isMaintenanceBlocked.description}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="b-type" className="label">Event Occasion</label>
                  <select
                    id="b-type"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="input"
                  >
                    {hall.eventTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-stone mb-1 font-medium">
                    <span>Expected Guests</span>
                    <span className="text-forest font-semibold">{guestCount} attendees</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max={hall.capacity.floating}
                    step="25"
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[11px] text-stone mt-1">
                    <span>50 Min</span>
                    <span>Max: {hall.capacity.floating}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={Boolean(isMaintenanceBlocked)}
                  className="btn btn-primary w-full py-3.5"
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>Request Booking</span>
                </button>
              </form>

              <div className="p-4 rounded-xl bg-ivory border border-line text-xs text-stone space-y-1.5">
                <p className="flex items-center gap-1.5 text-forest font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-success" />
                  <span>Zero Double-Booking Guarantee</span>
                </p>
                <p>• Requests are reviewed by hall management within 24 hours.</p>
                <p>• Confirmed slots immediately lock the public calendar.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Recommended Venues */}
        {similarHalls.length > 0 && (
          <div className="mt-24 pt-12 border-t border-line">
            <h2 className="text-3xl font-serif text-ink mb-8">Other Venues in Bengaluru</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {similarHalls.map((sh) => (
                <VenueCard key={sh.id} hall={sh} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HallDetailPage;
