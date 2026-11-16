export type BookingStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Completed';

export interface Booking {
  id: string;
  hallId: string;
  eventType: string;
  eventDate: string;   // YYYY-MM-DD, interpreted in Asia/Kolkata
  startTime: string;   // HH:mm (24h)
  endTime: string;     // HH:mm (24h)
  guests: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  requirements: string;
  status: BookingStatus;
  rejectionReason?: string;
  amount: number;
  createdAt: string;   // YYYY-MM-DD
}

export type MaintenanceStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Maintenance {
  id: string;
  hallId: string;
  startDate: string;   // YYYY-MM-DD inclusive
  endDate: string;     // YYYY-MM-DD inclusive
  description: string;
  status: MaintenanceStatus;
}

export type UserRole = 'customer' | 'admin';

export interface DemoUser {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
}
