export interface Amenity {
  id: string;
  name: string;
  category: 'audio_visual' | 'dining' | 'infrastructure' | 'comfort' | 'accessibility';
  icon: string;
}

export interface Hall {
  id: string;
  name: string;
  tagline: string;
  location: {
    address: string;
    area: string;
    city: string;
    pincode: string;
    coordinates?: { lat: number; lng: number };
  };
  description: string;
  images: {
    primary: string;
    gallery: string[];
  };
  capacity: {
    seated: number;
    floating: number;
    dining: number;
  };
  pricing: {
    baseRatePerDay: number;
    hourlyRate?: number;
    cleaningFee: number;
    depositRequired: number;
    currency: string;
    notes?: string;
  };
  eventTypes: string[];
  amenities: Amenity[];
  features: string[];
  rules: string[];
  rating: number;
  reviewsCount: number;
  isActive: boolean;
  isFeatured?: boolean;
}

export interface SearchFilters {
  searchTerm: string;
  area: string;
  eventType: string;
  minCapacity: number;
  maxPrice: number;
  selectedAmenities: string[];
  sortBy: 'featured' | 'price_low' | 'price_high' | 'capacity_high' | 'rating';
}
