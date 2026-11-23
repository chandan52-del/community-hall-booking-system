import React, { useState } from 'react';
import {
  LayoutDashboard, Building2, Calendar, Wrench,
  BarChart3, CheckCircle2, Clock, Plus, Search
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, AreaChart, Area
} from 'recharts';
import { useData } from '../contexts/DataContext';
import { StatusBadge, StatCard, Modal } from '../components/ui';
import { formatINR, formatDate, formatTime, todayIST } from '../lib/utils';
import toast, { Toaster } from 'react-hot-toast';

const REVENUE_DATA = [
  { month: 'Jun', bookings: 12, revenue: 840000 },
  { month: 'Jul', bookings: 18, revenue: 1250000 },
  { month: 'Aug', bookings: 15, revenue: 980000 },
  { month: 'Sep', bookings: 22, revenue: 1680000 },
  { month: 'Oct', bookings: 29, revenue: 2150000 },
  { month: 'Nov', bookings: 34, revenue: 2790000 },
];

export const AdminDashboardPage: React.FC = () => {
  const {
    halls, bookings, maintenance,
    setBookingStatus, addMaintenance, toggleHallActive
  } = useData();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'halls' | 'bookings' | 'maintenance' | 'reports'
  >('overview');

  // Rejection Modal State
  const [rejectingBookingId, setRejectingBookingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Maintenance Modal State
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [maintHallId, setMaintHallId] = useState(halls[0]?.id || '');
  const [maintStartDate, setMaintStartDate] = useState('');
  const [maintEndDate, setMaintEndDate] = useState('');
  const [maintDesc, setMaintDesc] = useState('');

  // Search & Filters in bookings tab
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const pendingBookings = bookings.filter((b) => b.status === 'Pending');
  const approvedBookings = bookings.filter((b) => b.status === 'Approved');

  // Handle Approve
  const handleApprove = async (id: string) => {
    const res = await setBookingStatus(id, 'Approved');
    if (!res.ok) {
      const conflictMsg = res.conflicts.map(c => c.label).join('; ') || res.error || 'Conflict with existing booking/maintenance';
      toast.error(`Cannot approve: ${conflictMsg}`);
      return;
    }
    toast.success(`Booking ${id} approved! Calendar slot locked.`);
  };

  // Handle Reject Modal
  const handleOpenReject = (id: string) => {
    setRejectingBookingId(id);
    setRejectionReason('Requested slot already booked or under facility maintenance.');
  };

  const handleConfirmReject = async () => {
    if (!rejectingBookingId) return;
    await setBookingStatus(rejectingBookingId, 'Rejected', rejectionReason);
    toast.success(`Booking ${rejectingBookingId} rejected.`);
    setRejectingBookingId(null);
    setRejectionReason('');
  };

  // Handle Add Maintenance
  const handleCreateMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintStartDate || !maintEndDate) {
      toast.error('Please specify start and end dates');
      return;
    }
    if (maintStartDate > maintEndDate) {
      toast.error('Start date cannot be after end date');
      return;
    }

    addMaintenance({
      hallId: maintHallId,
      startDate: maintStartDate,
      endDate: maintEndDate,
      description: maintDesc || 'Preventive facility maintenance & HVAC servicing',
      status: 'Scheduled',
    });

    toast.success('Maintenance blackout scheduled! Calendar updated.');
    setIsMaintModalOpen(false);
    setMaintStartDate('');
    setMaintEndDate('');
    setMaintDesc('');
  };

  // Filtered bookings table
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const hallObj = halls.find(h => h.id === b.hallId);
      const matchesHall = hallObj?.name.toLowerCase().includes(q);
      const matchesName = b.contactName.toLowerCase().includes(q);
      const matchesId = b.id.toLowerCase().includes(q);
      if (!matchesHall && !matchesName && !matchesId) return false;
    }
    return true;
  });

  return (
    <div className="pb-32">
      <Toaster position="top-right" />

      {/* Admin Header */}
      <section className="border-b border-line bg-paper">
        <div className="container-page py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="eyebrow">Enterprise console</span>
              <h1 className="text-3xl sm:text-4xl font-serif text-ink mt-2">
                Bengaluru Venues Master Console
              </h1>
              <p className="text-stone text-sm sm:text-base mt-1">
                Oversee hall inventories, review booking requests, and schedule facility maintenance windows.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMaintModalOpen(true)}
                className="btn btn-outline btn-sm"
              >
                <Wrench className="w-4 h-4 text-warning" />
                <span>Schedule Maintenance</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page mt-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-line pb-4 mb-8">
          {[
            { id: 'overview', label: 'Overview & Analytics', icon: LayoutDashboard },
            { id: 'bookings', label: `Booking Requests (${bookings.length})`, icon: Calendar },
            { id: 'halls', label: `Manage Halls (${halls.length})`, icon: Building2 },
            { id: 'maintenance', label: `Maintenance Schedules (${maintenance.length})`, icon: Wrench },
            { id: 'reports', label: 'Financial Reports', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all ${
                  isSelected
                    ? 'bg-forest text-ivory shadow-sm'
                    : 'text-stone hover:text-ink hover:bg-sand/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Total Halls"
                value={halls.length}
                hint={`${halls.filter(h => h.isActive).length} active listings`}
                icon={<Building2 className="w-5 h-5" />}
                tone="forest"
              />
              <StatCard
                label="Pending Review"
                value={pendingBookings.length}
                hint="Requires decision"
                icon={<Clock className="w-5 h-5" />}
                tone="warning"
              />
              <StatCard
                label="Approved Bookings"
                value={approvedBookings.length}
                hint="Confirmed reservations"
                icon={<CheckCircle2 className="w-5 h-5" />}
                tone="success"
              />
              <StatCard
                label="Maintenance Closures"
                value={maintenance.length}
                hint="Active blackout windows"
                icon={<Wrench className="w-5 h-5" />}
                tone="gold"
              />
            </div>

            {/* Recharts Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 card p-6 md:p-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-xl text-ink">Revenue Trajectory</h3>
                    <p className="text-xs text-stone">Monthly booking revenue across Bengaluru venues</p>
                  </div>
                  <span className="text-xs font-semibold text-forest bg-forest/8 px-2.5 py-1 rounded-full">
                    H2 2026 Fiscal
                  </span>
                </div>
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={REVENUE_DATA}>
                      <defs>
                        <linearGradient id="forestArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#173F35" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#173F35" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E7E4DC" />
                      <XAxis dataKey="month" stroke="#77786F" fontSize={11} />
                      <YAxis stroke="#77786F" fontSize={11} tickFormatter={(v) => `₹${v / 100000}L`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E7E4DC', borderRadius: '12px' }}
                        formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#173F35" strokeWidth={2} fillOpacity={1} fill="url(#forestArea)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-4 card p-6 md:p-7 space-y-4">
                <div>
                  <h3 className="font-serif text-xl text-ink">Monthly Event Volume</h3>
                  <p className="text-xs text-stone">Number of verified bookings</p>
                </div>
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={REVENUE_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E7E4DC" />
                      <XAxis dataKey="month" stroke="#77786F" fontSize={11} />
                      <YAxis stroke="#77786F" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E7E4DC', borderRadius: '12px' }}
                      />
                      <Bar dataKey="bookings" fill="#C6A66B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Pending Actions Table */}
            <div className="card p-6 md:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl text-ink">Pending Booking Approvals</h3>
                  <p className="text-xs text-stone">Review and lock event dates without overlapping conflicts</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('bookings')}
                  className="text-xs font-semibold text-forest hover:underline"
                >
                  View All ({bookings.length})
                </button>
              </div>

              {pendingBookings.length === 0 ? (
                <p className="text-sm text-stone py-4">No pending booking requests awaiting review.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-sand/40 text-stone uppercase tracking-wider border-b border-line">
                      <tr>
                        <th className="py-3 px-4 font-semibold">ID</th>
                        <th className="py-3 px-4 font-semibold">Venue</th>
                        <th className="py-3 px-4 font-semibold">Applicant</th>
                        <th className="py-3 px-4 font-semibold">Event Date</th>
                        <th className="py-3 px-4 font-semibold">Guests</th>
                        <th className="py-3 px-4 font-semibold">Tariff</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {pendingBookings.slice(0, 5).map((b) => {
                        const hallObj = halls.find(h => h.id === b.hallId);
                        return (
                          <tr key={b.id} className="hover:bg-sand/20 transition-colors">
                            <td className="py-3 px-4 font-mono font-semibold text-forest">{b.id}</td>
                            <td className="py-3 px-4 font-medium text-ink">{hallObj?.name}</td>
                            <td className="py-3 px-4 text-stone">{b.contactName}</td>
                            <td className="py-3 px-4 text-ink font-medium">{formatDate(b.eventDate)}</td>
                            <td className="py-3 px-4 text-stone">{b.guests}</td>
                            <td className="py-3 px-4 font-serif font-semibold text-ink">{formatINR(b.amount)}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleApprove(b.id)}
                                  className="btn btn-primary btn-sm py-1 px-3 text-xs"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenReject(b.id)}
                                  className="btn btn-danger btn-sm py-1 px-3 text-xs"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: BOOKING REQUESTS ================= */}
        {activeTab === 'bookings' && (
          <div className="card p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-serif text-ink">All Reservation Applications</h2>
                <p className="text-xs text-stone mt-1">Review applicant details, manage approvals, and review conflict histories</p>
              </div>

              {/* Search & Status Filter */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search applicant or ID..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="input pl-8 py-1.5 text-xs w-48"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input py-1.5 text-xs w-auto cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-sand/40 text-stone uppercase tracking-wider border-b border-line">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">ID</th>
                    <th className="py-3.5 px-4 font-semibold">Venue</th>
                    <th className="py-3.5 px-4 font-semibold">Applicant</th>
                    <th className="py-3.5 px-4 font-semibold">Event Date</th>
                    <th className="py-3.5 px-4 font-semibold">Time Slot</th>
                    <th className="py-3.5 px-4 font-semibold">Tariff</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredBookings.map((b) => {
                    const hallObj = halls.find(h => h.id === b.hallId);
                    return (
                      <tr key={b.id} className="hover:bg-sand/20 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-forest">{b.id}</td>
                        <td className="py-3.5 px-4 font-medium text-ink">{hallObj?.name}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-medium text-ink">{b.contactName}</p>
                          <p className="text-[11px] text-stone">{b.contactEmail}</p>
                        </td>
                        <td className="py-3.5 px-4 text-ink font-medium">{formatDate(b.eventDate)}</td>
                        <td className="py-3.5 px-4 text-stone">{formatTime(b.startTime)}–{formatTime(b.endTime)}</td>
                        <td className="py-3.5 px-4 font-serif font-semibold text-ink">{formatINR(b.amount)}</td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={b.status} />
                          {b.rejectionReason && (
                            <p className="text-[10px] text-danger italic mt-1 max-w-xs">{b.rejectionReason}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {b.status === 'Pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleApprove(b.id)}
                                className="btn btn-primary btn-sm py-1 px-3 text-xs"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenReject(b.id)}
                                className="btn btn-danger btn-sm py-1 px-3 text-xs"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-stone text-[11px] font-medium">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: MANAGE HALLS ================= */}
        {activeTab === 'halls' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif text-ink">Bengaluru Venue Inventory</h2>
                <p className="text-xs text-stone mt-1">Configure pricing schedules, activate listings and inspect capacities</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {halls.map((hall) => (
                <div key={hall.id} className="card p-5 space-y-4">
                  <div className="aspect-[16/10] rounded-xl overflow-hidden bg-sand">
                    <img src={hall.images.primary} alt={hall.name} className="w-full h-full object-cover" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gold-dark uppercase tracking-wider">{hall.location.area}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        hall.isActive ? 'bg-success/10 text-success' : 'bg-sand text-stone'
                      }`}>
                        {hall.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl text-ink mt-1">{hall.name}</h3>
                    <p className="text-xs text-stone mt-1 line-clamp-2">{hall.description}</p>
                  </div>

                  <div className="pt-3 border-t border-line flex items-center justify-between text-xs">
                    <div>
                      <span className="text-stone block">Standard Tariff</span>
                      <span className="font-serif font-bold text-ink text-sm">{formatINR(hall.pricing.baseRatePerDay)}</span>
                    </div>
                    <div>
                      <span className="text-stone block">Auditorium Seated</span>
                      <span className="font-bold text-forest text-sm">{hall.capacity.seated}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-line">
                    <button
                      type="button"
                      onClick={() => toggleHallActive(hall.id)}
                      className={`btn btn-sm w-full ${
                        hall.isActive ? 'btn-danger' : 'btn-outline'
                      }`}
                    >
                      {hall.isActive ? 'Deactivate Venue' : 'Activate Venue'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: MAINTENANCE ================= */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-serif text-ink">Facility Maintenance Management</h2>
                <p className="text-xs text-stone mt-1">
                  Scheduled maintenance windows automatically lock out booking availability on affected dates.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsMaintModalOpen(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule New Blackout</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {maintenance.map((m) => {
                const hallObj = halls.find((h) => h.id === m.hallId);
                return (
                  <div key={m.id} className="card p-6 border-l-4 border-l-warning space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-warning">{m.id}</span>
                      <StatusBadge status={m.status} />
                    </div>

                    <h3 className="font-serif text-xl text-ink">{hallObj?.name}</h3>
                    <p className="text-sm text-ink/80">{m.description}</p>

                    <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-stone">
                      <span>Blackout Window:</span>
                      <span className="font-medium text-ink">
                        {formatDate(m.startDate)} – {formatDate(m.endDate)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 5: REPORTS ================= */}
        {activeTab === 'reports' && (
          <div className="card p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-serif text-ink">Fiscal & Occupancy Reports</h2>
              <p className="text-xs text-stone mt-1">Audit billing totals, occupancy percentages and venue averages</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-5 rounded-xl bg-ivory border border-line">
                <span className="text-xs uppercase tracking-wider text-stone font-semibold">Total Verified Gatherings</span>
                <p className="text-3xl font-serif text-ink mt-2">130 Events</p>
              </div>
              <div className="p-5 rounded-xl bg-ivory border border-line">
                <span className="text-xs uppercase tracking-wider text-stone font-semibold">Gross Tariff Billed</span>
                <p className="text-3xl font-serif text-forest mt-2">₹96,90,000</p>
              </div>
              <div className="p-5 rounded-xl bg-ivory border border-line">
                <span className="text-xs uppercase tracking-wider text-stone font-semibold">Average Event Duration</span>
                <p className="text-3xl font-serif text-gold-dark mt-2">1.2 Days</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: REJECTION REASON ================= */}
      <Modal
        open={Boolean(rejectingBookingId)}
        onClose={() => setRejectingBookingId(null)}
        title="Reject Booking Application"
        footer={
          <>
            <button
              type="button"
              onClick={() => setRejectingBookingId(null)}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReject}
              className="btn btn-danger btn-sm"
            >
              Confirm Rejection
            </button>
          </>
        }
      >
        <p className="text-xs text-stone mb-3">
          Please provide the reason for declining application <strong className="text-ink">{rejectingBookingId}</strong>:
        </p>
        <textarea
          rows={3}
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          className="input resize-none"
          placeholder="e.g. Venue is under maintenance on requested date."
        />
      </Modal>

      {/* ================= MODAL: SCHEDULE MAINTENANCE ================= */}
      <Modal
        open={isMaintModalOpen}
        onClose={() => setIsMaintModalOpen(false)}
        title="Schedule Facility Maintenance"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsMaintModalOpen(false)}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateMaintenance}
              className="btn btn-primary btn-sm"
            >
              Schedule Blackout Window
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateMaintenance} className="space-y-4">
          <div>
            <label className="label">Select Hall</label>
            <select
              value={maintHallId}
              onChange={(e) => setMaintHallId(e.target.value)}
              className="input cursor-pointer"
            >
              {halls.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                required
                min={todayIST()}
                value={maintStartDate}
                onChange={(e) => setMaintStartDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                required
                min={maintStartDate || todayIST()}
                value={maintEndDate}
                onChange={(e) => setMaintEndDate(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Maintenance Scope</label>
            <textarea
              rows={3}
              required
              value={maintDesc}
              onChange={(e) => setMaintDesc(e.target.value)}
              placeholder="e.g. Annual HVAC chiller descaling & acoustic teakwood polishing"
              className="input resize-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDashboardPage;
