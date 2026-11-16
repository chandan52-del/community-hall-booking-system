import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Hall } from '../types/hall';
import type { Booking, BookingStatus, Maintenance, MaintenanceStatus } from '../types/booking';
import { BENGALURU_HALLS } from '../data/hallsData';
import { DEMO_BOOKINGS, DEMO_MAINTENANCE } from '../data/demoRecords';
import { findConflicts, todayIST, type Conflict } from '../lib/utils';
import { hallsApi, bookingsApi, maintenanceApi, apiClient } from '../services/api';
import { useAuth } from './AuthContext';

interface DataContextValue {
  halls: Hall[];
  bookings: Booking[];
  maintenance: Maintenance[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  getHall: (id: string) => Hall | undefined;
  createBooking: (input: Omit<Booking, 'id' | 'status' | 'createdAt'>) => Promise<Booking>;
  setBookingStatus: (id: string, status: BookingStatus, reason?: string) => Promise<{ ok: boolean; conflicts: Conflict[]; error?: string }>;
  addMaintenance: (input: Omit<Maintenance, 'id'>) => Promise<{ ok: boolean; item?: Maintenance; error?: string }>;
  updateMaintenance: (id: string, patch: Partial<Omit<Maintenance, 'id'>>) => Promise<void>;
  toggleHallActive: (id: string) => Promise<void>;
  updateHall: (id: string, patch: Partial<Hall>) => void;
  resetDemoData: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);
const STORAGE_KEY = 'sabha-halls-demo-v1';

interface PersistedState {
  halls: Hall[];
  bookings: Booking[];
  maintenance: Maintenance[];
}

const initialState = (): PersistedState => ({
  halls: BENGALURU_HALLS,
  bookings: DEMO_BOOKINGS,
  maintenance: DEMO_MAINTENANCE,
});

const loadState = (): PersistedState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PersistedState;
  } catch {
    /* fallback to seed */
  }
  return initialState();
};

// Helper: Map backend Hall record to rich frontend Hall interface
const mapBackendHall = (raw: any): Hall => {
  // Find matching static hall for rich description, features, event types fallback
  const staticMatch = BENGALURU_HALLS.find((h) => h.id === raw.id);

  const primaryImg = raw.images?.find((img: any) => img.isPrimary)?.url || raw.images?.[0]?.url || staticMatch?.images.primary || '';
  const galleryImgs = raw.images?.map((img: any) => img.url) || staticMatch?.images.gallery || [primaryImg];

  return {
    id: raw.id,
    name: raw.name,
    tagline: raw.tagline || staticMatch?.tagline || '',
    location: {
      address: raw.address || staticMatch?.location.address || '',
      area: raw.area || staticMatch?.location.area || 'Bengaluru',
      city: raw.city || 'Bengaluru',
      pincode: raw.pincode || staticMatch?.location.pincode || '560001',
      coordinates: staticMatch?.location.coordinates,
    },
    description: raw.description || staticMatch?.description || '',
    images: {
      primary: primaryImg,
      gallery: galleryImgs.length > 0 ? galleryImgs : [primaryImg],
    },
    capacity: {
      seated: raw.seatedCapacity || staticMatch?.capacity.seated || 500,
      floating: raw.floatingCapacity || staticMatch?.capacity.floating || 800,
      dining: raw.diningCapacity || staticMatch?.capacity.dining || 300,
    },
    pricing: {
      baseRatePerDay: Number(raw.baseRatePerDay) || staticMatch?.pricing.baseRatePerDay || 50000,
      hourlyRate: raw.hourlyRate ? Number(raw.hourlyRate) : staticMatch?.pricing.hourlyRate,
      cleaningFee: Number(raw.cleaningFee) || staticMatch?.pricing.cleaningFee || 3000,
      depositRequired: Number(raw.depositRequired) || staticMatch?.pricing.depositRequired || 15000,
      currency: raw.currency || 'INR',
      notes: raw.notes || staticMatch?.pricing.notes,
    },
    eventTypes: staticMatch?.eventTypes || ['Weddings', 'Seminars', 'Receptions', 'Cultural Gatherings'],
    amenities: raw.amenities || staticMatch?.amenities || [],
    features: staticMatch?.features || ['Air-conditioned', 'Power backup', 'Parking available'],
    rules: staticMatch?.rules || ['Music cutoff at 10:00 PM', 'Decor guidelines apply'],
    rating: staticMatch?.rating || 4.8,
    reviewsCount: staticMatch?.reviewsCount || 42,
    isActive: typeof raw.isActive === 'boolean' ? raw.isActive : true,
    isFeatured: typeof raw.isFeatured === 'boolean' ? raw.isFeatured : false,
  };
};

// Helper: Map backend Booking to frontend Booking
const mapBackendBooking = (b: any): Booking => {
  const statusCapitalized = (
    b.status ? b.status.charAt(0).toUpperCase() + b.status.slice(1).toLowerCase() : 'Pending'
  ) as BookingStatus;

  return {
    id: b.id,
    hallId: b.hallId,
    eventType: b.eventType,
    eventDate: b.eventDate,
    startTime: b.startTime,
    endTime: b.endTime,
    guests: b.guestsCount || b.guests || 200,
    contactName: b.contactName,
    contactEmail: b.contactEmail,
    contactPhone: b.contactPhone,
    requirements: b.specialRequests || b.requirements || '',
    status: statusCapitalized,
    rejectionReason: b.rejectionReason || undefined,
    amount: Number(b.totalAmount || b.amount || 0),
    createdAt: typeof b.createdAt === 'string' ? b.createdAt.slice(0, 10) : todayIST(),
  };
};

// Helper: Map backend Maintenance to frontend Maintenance
const mapBackendMaintenance = (m: any): Maintenance => {
  let statusFormatted: MaintenanceStatus = 'Scheduled';
  if (m.status === 'IN_PROGRESS') statusFormatted = 'In Progress';
  else if (m.status === 'COMPLETED') statusFormatted = 'Completed';
  else if (m.status === 'CANCELLED') statusFormatted = 'Cancelled';
  else statusFormatted = 'Scheduled';

  return {
    id: m.id,
    hallId: m.hallId,
    startDate: m.startDate,
    endDate: m.endDate,
    description: m.description,
    status: statusFormatted,
  };
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistedState>(loadState);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user, token } = useAuth();

  // Fetch live backend records when available
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Halls
      const hallsRes = await hallsApi.getAll();
      if (hallsRes.data && Array.isArray(hallsRes.data) && hallsRes.data.length > 0) {
        const mappedHalls = hallsRes.data.map(mapBackendHall);
        setState((s) => ({ ...s, halls: mappedHalls }));
      }

      // 2. Fetch Maintenance
      const maintRes = await maintenanceApi.getAll();
      if (maintRes.data && Array.isArray(maintRes.data)) {
        const mappedMaint = maintRes.data.map(mapBackendMaintenance);
        setState((s) => ({ ...s, maintenance: mappedMaint }));
      }

      // 3. Fetch Bookings (Admin sees all, Customer sees their own, Guest sees public/cached)
      if (token && user) {
        if (user.role === 'admin') {
          const bookingsRes = await bookingsApi.getAll();
          if (bookingsRes.data && Array.isArray(bookingsRes.data)) {
            const mappedBookings = bookingsRes.data.map(mapBackendBooking);
            setState((s) => ({ ...s, bookings: mappedBookings }));
          }
        } else {
          const bookingsRes = await bookingsApi.getMy();
          if (bookingsRes.data && Array.isArray(bookingsRes.data)) {
            const mappedBookings = bookingsRes.data.map(mapBackendBooking);
            setState((s) => ({ ...s, bookings: mappedBookings }));
          }
        }
      }
    } catch {
      // Offline fallback: keep existing persisted state
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Persist local state for fast subsequent paints
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const getHall = useCallback((id: string) => state.halls.find((h) => h.id === id), [state.halls]);

  const createBooking: DataContextValue['createBooking'] = async (input) => {
    // Attempt real backend creation
    try {
      const res = await bookingsApi.create({
        hallId: input.hallId,
        eventType: input.eventType,
        eventDate: input.eventDate,
        startTime: input.startTime,
        endTime: input.endTime,
        guestsCount: input.guests,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        specialRequests: input.requirements,
      });

      if (res.data) {
        const mapped = mapBackendBooking(res.data);
        setState((s) => ({ ...s, bookings: [mapped, ...s.bookings] }));
        return mapped;
      }
    } catch {
      // Fallback local booking
    }

    const fallbackBooking: Booking = {
      ...input,
      id: `BK-${Date.now().toString().slice(-4)}`,
      status: 'Pending',
      createdAt: todayIST(),
    };
    setState((s) => ({ ...s, bookings: [fallbackBooking, ...s.bookings] }));
    return fallbackBooking;
  };

  const setBookingStatus: DataContextValue['setBookingStatus'] = async (id, status, reason) => {
    const target = state.bookings.find((b) => b.id === id);
    if (!target) return { ok: false, conflicts: [] };

    // 1. If approving, try real backend row-locking approval
    if (status === 'Approved') {
      try {
        const res = await bookingsApi.approve(id);
        if (res.data) {
          setState((s) => ({
            ...s,
            bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: 'Approved', rejectionReason: undefined } : b)),
          }));
          return { ok: true, conflicts: [] };
        }
      } catch (err: any) {
        if (err.response?.status === 409) {
          const errMsg = err.response.data?.error?.message || 'Conflicting approved reservation or maintenance blackout exists';
          return {
            ok: false,
            conflicts: [{ kind: 'booking', label: errMsg }],
            error: errMsg,
          };
        }
      }

      // Local conflict check fallback
      const conflicts = findConflicts(target, state.bookings, state.maintenance);
      if (conflicts.length) return { ok: false, conflicts };
    }

    // 2. If rejecting
    if (status === 'Rejected') {
      try {
        await bookingsApi.reject(id, reason || 'Rejected by Administrator');
      } catch {
        // Fallback local
      }
    }

    // 3. If cancelling
    if (status === 'Cancelled') {
      try {
        await bookingsApi.cancel(id);
      } catch {
        // Fallback local
      }
    }

    setState((s) => ({
      ...s,
      bookings: s.bookings.map((b) => (b.id === id ? { ...b, status, rejectionReason: reason ?? b.rejectionReason } : b)),
    }));
    return { ok: true, conflicts: [] };
  };

  const addMaintenance: DataContextValue['addMaintenance'] = async (input) => {
    try {
      const res = await maintenanceApi.create({
        hallId: input.hallId,
        startDate: input.startDate,
        endDate: input.endDate,
        description: input.description,
      });

      if (res.data) {
        const mapped = mapBackendMaintenance(res.data);
        setState((s) => ({ ...s, maintenance: [mapped, ...s.maintenance] }));
        return { ok: true, item: mapped };
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        const errMsg = err.response.data?.error?.message || 'Maintenance period overlaps with an approved booking';
        return { ok: false, error: errMsg };
      }
    }

    const fallbackItem: Maintenance = {
      ...input,
      id: `MT-${Date.now().toString().slice(-4)}`,
    };
    setState((s) => ({ ...s, maintenance: [fallbackItem, ...s.maintenance] }));
    return { ok: true, item: fallbackItem };
  };

  const updateMaintenance: DataContextValue['updateMaintenance'] = async (id, patch) => {
    if (patch.status) {
      try {
        let beStatus = 'SCHEDULED';
        if (patch.status === 'In Progress') beStatus = 'IN_PROGRESS';
        else if (patch.status === 'Completed') beStatus = 'COMPLETED';
        else if (patch.status === 'Cancelled') beStatus = 'CANCELLED';

        await maintenanceApi.updateStatus(id, beStatus);
      } catch {
        // Local fallback
      }
    }
    setState((s) => ({
      ...s,
      maintenance: s.maintenance.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  };

  const toggleHallActive = async (id: string) => {
    try {
      await apiClient.patch(`/halls/${id}/toggle-status`);
    } catch {
      // Local fallback
    }
    setState((s) => ({
      ...s,
      halls: s.halls.map((h) => (h.id === id ? { ...h, isActive: !h.isActive } : h)),
    }));
  };

  const updateHall = (id: string, patch: Partial<Hall>) =>
    setState((s) => ({ ...s, halls: s.halls.map((h) => (h.id === id ? { ...h, ...patch } : h)) }));

  const resetDemoData = () => setState(initialState());

  const value = useMemo<DataContextValue>(
    () => ({
      halls: state.halls,
      bookings: state.bookings,
      maintenance: state.maintenance,
      isLoading,
      refreshData,
      getHall,
      createBooking,
      setBookingStatus,
      addMaintenance,
      updateMaintenance,
      toggleHallActive,
      updateHall,
      resetDemoData,
    }),
    [state, isLoading, refreshData, getHall],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
};
