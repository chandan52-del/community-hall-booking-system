import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar, Clock, Users, CheckCircle2,
  Send, PlusCircle, FileText, AlertCircle
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useCustomer } from '../contexts/AuthContext';
import { StatusBadge, StatCard, EmptyState } from '../components/ui';
import { formatINR, formatDate, formatTime, todayIST, maintenanceOn } from '../lib/utils';
import toast, { Toaster } from 'react-hot-toast';

export const CustomerPortalPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { halls, bookings, createBooking, setBookingStatus, maintenance } = useData();
  const customer = useCustomer();

  const [activeTab, setActiveTab] = useState<'new_request' | 'my_bookings' | 'profile'>(
    searchParams.get('hall') || searchParams.get('date') ? 'new_request' : 'my_bookings'
  );

  // New Request Form State (seeded from URL params if redirected from hall details)
  const initialHallId = searchParams.get('hall') || halls[0]?.id || '';
  const [selectedHallId, setSelectedHallId] = useState<string>(initialHallId);
  const [eventType, setEventType] = useState<string>(searchParams.get('type') || '');
  const [eventDate, setEventDate] = useState<string>(searchParams.get('date') || '');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('18:00');
  const [guestsCount, setGuestsCount] = useState<number>(Number(searchParams.get('guests')) || 300);
  const [contactName, setContactName] = useState<string>(customer.name);
  const [contactEmail, setContactEmail] = useState<string>(customer.email);
  const [contactPhone, setContactPhone] = useState<string>(customer.phone);
  const [requirements, setRequirements] = useState<string>('');

  const selectedHall = halls.find((h) => h.id === selectedHallId) || halls[0];

  // Filter bookings for this customer
  const customerBookings = bookings.filter(
    (b) => b.contactEmail.toLowerCase() === customer.email.toLowerCase() || b.contactName.toLowerCase() === customer.name.toLowerCase()
  );

  const pendingCount = customerBookings.filter((b) => b.status === 'Pending').length;
  const approvedCount = customerBookings.filter((b) => b.status === 'Approved').length;

  const isMaintenanceBlocked = eventDate ? maintenanceOn(selectedHallId, eventDate, maintenance) : null;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDate) {
      toast.error('Please specify the event date');
      return;
    }
    if (isMaintenanceBlocked) {
      toast.error(`Venue is under scheduled maintenance on ${formatDate(eventDate)}.`);
      return;
    }

    const calculatedTotal = selectedHall.pricing.baseRatePerDay + selectedHall.pricing.cleaningFee;

    const newBooking = await createBooking({
      hallId: selectedHall.id,
      eventType: eventType || selectedHall.eventTypes[0] || 'Community Gathering',
      eventDate,
      startTime,
      endTime,
      guests: guestsCount,
      contactName,
      contactEmail,
      contactPhone,
      requirements: requirements || 'Standard hall seating & catering setup',
      amount: calculatedTotal,
    });

    toast.success(`Booking request ${newBooking.id} submitted for administrator review.`);
    setActiveTab('my_bookings');
  };

  const handleCancelBooking = async (bookingId: string) => {
    const res = await setBookingStatus(bookingId, 'Cancelled');
    if (res.ok) {
      toast.success(`Booking ${bookingId} cancelled.`);
    }
  };

  return (
    <div className="pb-24">
      <Toaster position="top-right" />

      {/* Header Banner */}
      <section className="border-b border-line bg-paper">
        <div className="container-page py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="eyebrow">Customer portal</span>
              <h1 className="text-3xl sm:text-4xl font-serif text-ink mt-2">
                Welcome back, {customer.name}
              </h1>
              <p className="text-stone text-sm sm:text-base mt-1">
                Manage your Bengaluru hall reservations, check review updates and submit new event dates.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('new_request')}
                className="btn btn-primary"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Booking Request</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page mt-8">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <StatCard
            label="Total Booking Requests"
            value={customerBookings.length}
            hint="All submitted applications"
            icon={<FileText className="w-5 h-5" />}
            tone="forest"
          />
          <StatCard
            label="Approved & Confirmed"
            value={approvedCount}
            hint="Dates locked on the calendar"
            icon={<CheckCircle2 className="w-5 h-5" />}
            tone="success"
          />
          <StatCard
            label="Pending Review"
            value={pendingCount}
            hint="Awaiting admin approval"
            icon={<Clock className="w-5 h-5" />}
            tone="warning"
          />
        </div>

        {/* Portal Tabs */}
        <div className="flex items-center gap-2 border-b border-line pb-4 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('my_bookings')}
            className={`px-5 py-2.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all ${
              activeTab === 'my_bookings'
                ? 'bg-forest text-ivory shadow-sm'
                : 'text-stone hover:text-ink hover:bg-sand/60'
            }`}
          >
            My Reservations ({customerBookings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('new_request')}
            className={`px-5 py-2.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all ${
              activeTab === 'new_request'
                ? 'bg-forest text-ivory shadow-sm'
                : 'text-stone hover:text-ink hover:bg-sand/60'
            }`}
          >
            New Request Form
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-5 py-2.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all ${
              activeTab === 'profile'
                ? 'bg-forest text-ivory shadow-sm'
                : 'text-stone hover:text-ink hover:bg-sand/60'
            }`}
          >
            Organizer Profile
          </button>
        </div>

        {/* ================= TAB 1: MY BOOKINGS ================= */}
        {activeTab === 'my_bookings' && (
          <div>
            {customerBookings.length === 0 ? (
              <EmptyState
                icon={<Calendar className="w-6 h-6" />}
                title="No booking requests yet"
                description="Explore our five Bengaluru demonstration venues and request your preferred event date."
                action={
                  <button
                    onClick={() => setActiveTab('new_request')}
                    className="btn btn-primary"
                  >
                    Submit First Request
                  </button>
                }
              />
            ) : (
              <div className="space-y-4">
                {customerBookings.map((b) => {
                  const hallObj = halls.find((h) => h.id === b.hallId);
                  return (
                    <div
                      key={b.id}
                      className="card p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:shadow-[var(--shadow-soft)]"
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-mono text-xs font-semibold text-forest bg-forest/8 px-2.5 py-0.5 rounded-md">
                            {b.id}
                          </span>
                          <StatusBadge status={b.status} />
                          <span className="text-xs text-stone">Submitted on {formatDate(b.createdAt)}</span>
                        </div>

                        <div>
                          <h3 className="text-2xl font-serif text-ink">
                            {hallObj ? hallObj.name : b.hallId}
                          </h3>
                          <p className="text-xs text-stone mt-0.5">
                            {hallObj?.location.area}, Bengaluru • {b.eventType}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-ink/80 pt-1">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-moss" />
                            <span>{formatDate(b.eventDate)}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gold-dark" />
                            <span>{formatTime(b.startTime)} – {formatTime(b.endTime)}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-forest" />
                            <span>{b.guests} Guests</span>
                          </span>
                        </div>

                        {b.requirements && (
                          <p className="text-xs text-stone italic max-w-xl">
                            "{b.requirements}"
                          </p>
                        )}

                        {b.status === 'Rejected' && b.rejectionReason && (
                          <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span><strong>Reason:</strong> {b.rejectionReason}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-line">
                        <div className="md:text-right">
                          <span className="text-[11px] uppercase tracking-wider text-stone block font-semibold">Total Estimated Tariff</span>
                          <span className="text-2xl font-serif text-forest font-semibold">
                            {formatINR(b.amount)}
                          </span>
                        </div>

                        {b.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(b.id)}
                            className="btn btn-danger btn-sm"
                          >
                            Cancel Request
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: NEW REQUEST FORM ================= */}
        {activeTab === 'new_request' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 card p-7 md:p-9 space-y-6">
              <div>
                <h2 className="text-2xl font-serif text-ink">Submit Hall Reservation Request</h2>
                <p className="text-stone text-xs sm:text-sm mt-1">
                  Specify your venue, timings and guest layout. Requests are reviewed without overlapping slot collisions.
                </p>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-5">
                {/* Select Hall */}
                <div>
                  <label htmlFor="req-hall" className="label">Select Bengaluru Hall</label>
                  <select
                    id="req-hall"
                    value={selectedHallId}
                    onChange={(e) => setSelectedHallId(e.target.value)}
                    className="input cursor-pointer"
                  >
                    {halls.filter(h => h.isActive).map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.location.area}) — Up to {h.capacity.seated} seated
                      </option>
                    ))}
                  </select>
                </div>

                {/* Event Category & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="req-type" className="label">Occasion Category</label>
                    <select
                      id="req-type"
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="input cursor-pointer"
                    >
                      {selectedHall.eventTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="req-date" className="label">Requested Date</label>
                    <input
                      id="req-date"
                      type="date"
                      required
                      min={todayIST()}
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="input"
                    />
                    {isMaintenanceBlocked && (
                      <p className="text-xs text-danger mt-1 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Venue closed for maintenance: {isMaintenanceBlocked.description}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Slot Timings & Guests */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="req-start" className="label">Start Time</label>
                    <input
                      id="req-start"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label htmlFor="req-end" className="label">End Time</label>
                    <input
                      id="req-end"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label htmlFor="req-guests" className="label">Expected Guests</label>
                    <input
                      id="req-guests"
                      type="number"
                      min={20}
                      max={selectedHall.capacity.floating}
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(Number(e.target.value))}
                      className="input"
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label htmlFor="req-name" className="label">Organizer Name</label>
                    <input
                      id="req-name"
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label htmlFor="req-email" className="label">Email Address</label>
                    <input
                      id="req-email"
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label htmlFor="req-phone" className="label">Phone Number</label>
                    <input
                      id="req-phone"
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>

                {/* Special Requirements */}
                <div>
                  <label htmlFor="req-notes" className="label">Special Requirements & Layout Notes</label>
                  <textarea
                    id="req-notes"
                    rows={3}
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="Specify audio-visual needs, green room access, valet staff or dining layout..."
                    className="input resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={Boolean(isMaintenanceBlocked)}
                  className="btn btn-primary w-full py-3.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Official Booking Request</span>
                </button>
              </form>
            </div>

            {/* Sidebar Summary */}
            <div className="lg:col-span-4 space-y-6">
              <div className="card p-6 space-y-4">
                <div className="aspect-[16/10] rounded-xl overflow-hidden bg-sand">
                  <img
                    src={selectedHall.images.primary}
                    alt={selectedHall.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-gold-dark font-semibold">
                    {selectedHall.location.area}
                  </span>
                  <h3 className="text-xl font-serif text-ink">{selectedHall.name}</h3>
                  <p className="text-xs text-stone mt-1 line-clamp-2">{selectedHall.description}</p>
                </div>

                <div className="pt-3 border-t border-line space-y-2 text-xs text-stone">
                  <div className="flex justify-between">
                    <span>Base Day Rental</span>
                    <span className="font-semibold text-ink">{formatINR(selectedHall.pricing.baseRatePerDay)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cleaning & Sanitization</span>
                    <span className="font-semibold text-ink">{formatINR(selectedHall.pricing.cleaningFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Refundable Deposit</span>
                    <span className="font-semibold text-ink">{formatINR(selectedHall.pricing.depositRequired)}</span>
                  </div>
                  <div className="pt-2 border-t border-line flex justify-between text-sm font-semibold text-forest">
                    <span>Estimated Total</span>
                    <span>{formatINR(selectedHall.pricing.baseRatePerDay + selectedHall.pricing.cleaningFee)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-paper border border-line text-xs text-stone space-y-1.5">
                <p className="font-semibold text-ink">Reservation Protocol:</p>
                <p>• Requests are reviewed within 24 hours.</p>
                <p>• Zero risk of overlapping bookings.</p>
                <p>• You may cancel pending requests freely.</p>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: PROFILE ================= */}
        {activeTab === 'profile' && (
          <div className="max-w-xl card p-8 space-y-6">
            <h2 className="text-2xl font-serif text-ink">Organizer Profile Details</h2>
            <div className="space-y-4 text-sm">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Registered Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Contact Phone</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="input"
                />
              </div>
              <button
                type="button"
                onClick={() => toast.success('Profile preferences updated')}
                className="btn btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPortalPage;
