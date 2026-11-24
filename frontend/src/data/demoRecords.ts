import type { Booking, Maintenance } from '../types/booking';

/**
 * Seed records for the frontend demo. These are clearly fictional sample
 * bookings used to exercise the UI — they are NOT real reservations.
 * Phase 3 replaces them with rows from the MySQL database.
 */
export const DEMO_BOOKINGS: Booking[] = [
  {
    id: 'BK-101', hallId: 'ecc-centre-whitefield', eventType: 'Academic Seminars',
    eventDate: '2026-11-20', startTime: '09:00', endTime: '17:00', guests: 420,
    contactName: 'Rohit Shenoy', contactEmail: 'rohit.shenoy@example.com', contactPhone: '+91 98450 12345',
    requirements: 'Podium microphone and projector for the keynote.', status: 'Approved', amount: 69500, createdAt: '2026-11-08',
  },
  {
    id: 'BK-102', hallId: 'ebisu-convention-center', eventType: 'Grand Weddings',
    eventDate: '2026-12-14', startTime: '08:00', endTime: '23:00', guests: 1400,
    contactName: 'Rohit Shenoy', contactEmail: 'rohit.shenoy@example.com', contactPhone: '+91 98450 12345',
    requirements: 'Parking coordination for guests.', status: 'Pending', amount: 235000, createdAt: '2026-11-14',
  },
  {
    id: 'BK-103', hallId: 'tarunn-grand-party-hall', eventType: 'Family Reunions',
    eventDate: '2026-11-28', startTime: '11:00', endTime: '16:00', guests: 200,
    contactName: 'Deepa Hegde', contactEmail: 'deepa.hegde@example.com', contactPhone: '+91 99000 11223',
    requirements: 'Vegetarian buffet layout.', status: 'Pending', amount: 37500, createdAt: '2026-11-12',
  },
  {
    id: 'BK-104', hallId: 'chowdiah-memorial-hall', eventType: 'Classical Concerts',
    eventDate: '2026-11-25', startTime: '17:30', endTime: '21:00', guests: 900,
    contactName: 'Sangeetha Sabha (demo)', contactEmail: 'events@example.org', contactPhone: '+91 80 1111 2222',
    requirements: 'Green room for 12 musicians.', status: 'Pending', amount: 101000, createdAt: '2026-11-10',
  },
  {
    id: 'BK-105', hallId: 'gayatri-vihar-sagar', eventType: 'National Exhibitions',
    eventDate: '2026-10-18', startTime: '10:00', endTime: '20:00', guests: 2500,
    contactName: 'Anil Kumar', contactEmail: 'anil.kumar@example.com', contactPhone: '+91 98860 44556',
    requirements: 'Stall layout for 80 exhibitors.', status: 'Completed', amount: 405000, createdAt: '2026-09-02',
  },
  {
    id: 'BK-106', hallId: 'ecc-centre-whitefield', eventType: 'Weddings',
    eventDate: '2026-11-20', startTime: '12:00', endTime: '20:00', guests: 350,
    contactName: 'Meera Iyer', contactEmail: 'meera.iyer@example.com', contactPhone: '+91 97400 99887',
    requirements: 'Floral stage backdrop.', status: 'Pending', amount: 69500, createdAt: '2026-11-15',
  },
  {
    id: 'BK-107', hallId: 'tarunn-grand-party-hall', eventType: 'Birthday Parties',
    eventDate: '2026-10-05', startTime: '18:00', endTime: '22:00', guests: 120,
    contactName: 'Rohit Shenoy', contactEmail: 'rohit.shenoy@example.com', contactPhone: '+91 98450 12345',
    requirements: '', status: 'Rejected', rejectionReason: 'Requested slot was already reserved.', amount: 37500, createdAt: '2026-09-20',
  },
];

export const DEMO_MAINTENANCE: Maintenance[] = [
  {
    id: 'MT-101', hallId: 'chowdiah-memorial-hall', startDate: '2026-11-24', endDate: '2026-11-25',
    description: 'Stage floor refinishing and sound system calibration.', status: 'Scheduled',
  },
  {
    id: 'MT-102', hallId: 'gayatri-vihar-sagar', startDate: '2026-11-29', endDate: '2026-12-01',
    description: 'Air-conditioning plant servicing.', status: 'Scheduled',
  },
];
