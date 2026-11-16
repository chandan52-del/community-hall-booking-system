import type { Hall } from '../types/hall';

/**
 * FIVE BENGALURU DEMONSTRATION LISTINGS
 * ------------------------------------
 * Venue names and localities are real. Everything numeric (capacity, pricing) and the
 * facility lists are DEMONSTRATION VALUES chosen to make the UI realistic — they are not
 * official figures and must be confirmed with each venue. An administrator can edit them.
 * Images are representative stock photography (Unsplash), not photos of these venues.
 * `rating` / `reviewsCount` are kept for type compatibility but are not displayed.
 */

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

export const BENGALURU_HALLS: Hall[] = [
  {
    id: 'ecc-centre-whitefield',
    name: 'ECC Centre Community Hall',
    tagline: 'A calm, garden-set venue in Whitefield',
    location: { address: 'Ecumenical Christian Centre, Whitefield', area: 'Whitefield', city: 'Bengaluru', pincode: '560066' },
    description:
      'Set within the leafy campus of the Ecumenical Christian Centre in Whitefield, this community hall suits seminars, cultural programmes, community gatherings and modest receptions. The surrounding greenery offers a quieter setting than most venues in the city’s technology corridor.',
    images: {
      primary: img('photo-1519167758481-83f550bb49b3'),
      gallery: [img('photo-1519167758481-83f550bb49b3'), img('photo-1505373877841-8d25f7d46678'), img('photo-1464366400600-7168b8af9bc3'), img('photo-1511578314322-379afb476865')],
    },
    capacity: { seated: 500, floating: 800, dining: 300 },
    pricing: { baseRatePerDay: 65000, hourlyRate: 8500, cleaningFee: 4500, depositRequired: 20000, currency: 'INR', notes: 'Demonstration pricing — confirm current tariff with the venue.' },
    eventTypes: ['Community Gatherings', 'Weddings', 'Cultural Festivals', 'Academic Seminars', 'Corporate Offsites'],
    amenities: [
      { id: 'ac', name: 'Air conditioning', category: 'comfort', icon: 'Wind' },
      { id: 'parking', name: 'On-site parking', category: 'infrastructure', icon: 'Car' },
      { id: 'av', name: 'Sound system & microphones', category: 'audio_visual', icon: 'Volume2' },
      { id: 'stage', name: 'Stage', category: 'infrastructure', icon: 'Layers' },
      { id: 'dining', name: 'Dining area', category: 'dining', icon: 'Utensils' },
      { id: 'backup', name: 'Power backup', category: 'infrastructure', icon: 'Zap' },
      { id: 'green_rooms', name: 'Green rooms', category: 'comfort', icon: 'DoorClosed' },
    ],
    features: ['Garden campus setting', 'Suited to day-long seminars and programmes', 'Outdoor space for breakout sessions'],
    rules: ['Amplified music subject to local noise regulations', 'Decor and catering arrangements to be agreed in advance', 'Venue to be returned in its original condition'],
    rating: 0, reviewsCount: 0, isActive: true, isFeatured: true,
  },
  {
    id: 'ebisu-convention-center',
    name: 'EBISU Convention Center',
    tagline: 'A large-format convention venue in north Bengaluru',
    location: { address: 'Hegde Nagar', area: 'Hegde Nagar', city: 'Bengaluru', pincode: '560077' },
    description:
      'A convention venue in Hegde Nagar, north Bengaluru, used for weddings, receptions and corporate events. Its large hall works well for guest lists that outgrow neighbourhood community halls.',
    images: {
      primary: img('photo-1540575467063-178a50c2df87'),
      gallery: [img('photo-1540575467063-178a50c2df87'), img('photo-1478146896981-b80fe463b330'), img('photo-1519225421980-715cb0215aed'), img('photo-1469371670807-013ccf25f16a')],
    },
    capacity: { seated: 1200, floating: 2000, dining: 800 },
    pricing: { baseRatePerDay: 220000, hourlyRate: 25000, cleaningFee: 15000, depositRequired: 50000, currency: 'INR', notes: 'Demonstration pricing — confirm current tariff with the venue.' },
    eventTypes: ['Grand Weddings', 'Receptions', 'Corporate Conclaves', 'Award Ceremonies', 'Product Launches'],
    amenities: [
      { id: 'ac', name: 'Air conditioning', category: 'comfort', icon: 'Wind' },
      { id: 'parking', name: 'Parking', category: 'infrastructure', icon: 'Car' },
      { id: 'av', name: 'Audio-visual equipment', category: 'audio_visual', icon: 'Monitor' },
      { id: 'stage', name: 'Stage', category: 'infrastructure', icon: 'Layers' },
      { id: 'dining', name: 'Separate dining hall', category: 'dining', icon: 'Utensils' },
      { id: 'backup', name: 'Power backup', category: 'infrastructure', icon: 'Zap' },
      { id: 'bridal_suites', name: 'Bride & groom rooms', category: 'comfort', icon: 'Sparkles' },
    ],
    features: ['Large main hall for big guest lists', 'Separate dining space', 'Suited to weddings and corporate events'],
    rules: ['Setup and teardown times to be agreed at booking', 'Fire-safety approval required for special effects', 'Amplified music subject to local noise regulations'],
    rating: 0, reviewsCount: 0, isActive: true, isFeatured: true,
  },
  {
    id: 'tarunn-grand-party-hall',
    name: 'Tarunn Grand Party Hall',
    tagline: 'An accessible party hall in KR Puram',
    location: { address: 'KR Puram', area: 'KR Puram', city: 'Bengaluru', pincode: '560036' },
    description:
      'A party hall in KR Puram, east Bengaluru, suited to birthdays, engagements, naming ceremonies and family get-togethers. A practical, budget-conscious choice for mid-sized celebrations.',
    images: {
      primary: img('photo-1511795409834-ef04bbd61622'),
      gallery: [img('photo-1511795409834-ef04bbd61622'), img('photo-1530103862676-de8c9debad1d'), img('photo-1527529482837-4698179dc6ce'), img('photo-1464366400600-7168b8af9bc3')],
    },
    capacity: { seated: 250, floating: 400, dining: 180 },
    pricing: { baseRatePerDay: 35000, hourlyRate: 4500, cleaningFee: 2500, depositRequired: 10000, currency: 'INR', notes: 'Demonstration pricing — confirm current tariff with the venue.' },
    eventTypes: ['Birthday Parties', 'Engagement Ceremonies', 'Naming Ceremonies', 'Family Reunions', 'Receptions'],
    amenities: [
      { id: 'ac', name: 'Air conditioning', category: 'comfort', icon: 'Wind' },
      { id: 'parking', name: 'Parking', category: 'infrastructure', icon: 'Car' },
      { id: 'av', name: 'Sound system', category: 'audio_visual', icon: 'Volume2' },
      { id: 'stage', name: 'Decorated stage area', category: 'infrastructure', icon: 'Layers' },
      { id: 'dining', name: 'Dining area', category: 'dining', icon: 'Utensils' },
      { id: 'backup', name: 'Power backup', category: 'infrastructure', icon: 'Zap' },
      { id: 'rooms', name: 'Changing room', category: 'comfort', icon: 'DoorClosed' },
    ],
    features: ['Good fit for 100–300 guests', 'Flexible seating layouts', 'Convenient for east Bengaluru'],
    rules: ['Decor vendors may access the hall before the event by arrangement', 'Dining area to be cleared after use', 'Security deposit refunded after inspection'],
    rating: 0, reviewsCount: 0, isActive: true, isFeatured: false,
  },
  {
    id: 'gayatri-vihar-sagar',
    name: 'Gayatri Vihar Sagar',
    tagline: 'Expansive event grounds at Palace Grounds',
    location: { address: 'Palace Grounds', area: 'Palace Grounds', city: 'Bengaluru', pincode: '' },
    description:
      'Located at Bengaluru’s Palace Grounds, Gayatri Vihar is known for hosting large weddings, exhibitions and public events. Its scale makes it one of the options for gatherings in the thousands.',
    images: {
      primary: img('photo-1464366400600-7168b8af9bc3'),
      gallery: [img('photo-1464366400600-7168b8af9bc3'), img('photo-1519741497674-611481863552'), img('photo-1505236858219-8359eb29e329'), img('photo-1540575467063-178a50c2df87')],
    },
    capacity: { seated: 2000, floating: 4000, dining: 1200 },
    pricing: { baseRatePerDay: 380000, hourlyRate: 40000, cleaningFee: 25000, depositRequired: 75000, currency: 'INR', notes: 'Demonstration pricing — confirm current tariff with the venue.' },
    eventTypes: ['Royal Weddings', 'Mega Receptions', 'National Exhibitions', 'Live Concerts', 'State Banquets'],
    amenities: [
      { id: 'ac', name: 'Air conditioning', category: 'comfort', icon: 'Wind' },
      { id: 'parking', name: 'Large parking area', category: 'infrastructure', icon: 'Car' },
      { id: 'av', name: 'Stage lighting & sound', category: 'audio_visual', icon: 'Volume2' },
      { id: 'stage', name: 'Large stage', category: 'infrastructure', icon: 'Layers' },
      { id: 'dining', name: 'Dining hall', category: 'dining', icon: 'Utensils' },
      { id: 'backup', name: 'Power backup', category: 'infrastructure', icon: 'Zap' },
      { id: 'vip_lounge', name: 'VIP / dressing rooms', category: 'comfort', icon: 'Sparkles' },
    ],
    features: ['Located at Palace Grounds', 'Suited to very large guest lists', 'Indoor hall with surrounding open space'],
    rules: ['Event permits may be required for public events', 'Traffic and parking marshals recommended for large events', 'Amplified music subject to local noise regulations'],
    rating: 0, reviewsCount: 0, isActive: true, isFeatured: true,
  },
  {
    id: 'chowdiah-memorial-hall',
    name: 'Chowdiah Memorial Hall',
    tagline: 'Bengaluru’s violin-shaped concert auditorium',
    location: { address: 'Vyalikaval, Malleshwaram', area: 'Malleshwaram', city: 'Bengaluru', pincode: '560003' },
    description:
      'Built in the shape of a violin as a tribute to the violinist T. Chowdiah, this auditorium is one of Bengaluru’s best-known cultural landmarks. It is a long-standing venue for classical music, dance, theatre and cultural programmes.',
    images: {
      primary: img('photo-1507676184212-d03ab07a01bf'),
      gallery: [img('photo-1507676184212-d03ab07a01bf'), img('photo-1514525253161-7a46d19cd819'), img('photo-1465847899084-d164df4dedc6'), img('photo-1503095396549-807759245b35')],
    },
    capacity: { seated: 1000, floating: 1000, dining: 0 },
    pricing: { baseRatePerDay: 95000, hourlyRate: 12000, cleaningFee: 6000, depositRequired: 25000, currency: 'INR', notes: 'Demonstration pricing — confirm current tariff with the venue.' },
    eventTypes: ['Classical Concerts', 'Theatre & Dramas', 'Dance Recitals', 'Cultural Awards', 'Literary Convocations'],
    amenities: [
      { id: 'ac', name: 'Air conditioning', category: 'comfort', icon: 'Wind' },
      { id: 'parking', name: 'Parking', category: 'infrastructure', icon: 'Car' },
      { id: 'av', name: 'Auditorium sound system', category: 'audio_visual', icon: 'Volume2' },
      { id: 'stage', name: 'Proscenium stage', category: 'infrastructure', icon: 'Layers' },
      { id: 'backup', name: 'Power backup', category: 'infrastructure', icon: 'Zap' },
      { id: 'artist_rooms', name: 'Green rooms for artists', category: 'comfort', icon: 'DoorClosed' },
    ],
    features: ['Distinctive violin-shaped architecture', 'Tiered auditorium seating', 'Central location in north-west Bengaluru'],
    rules: ['Food and drink not permitted inside the auditorium', 'Technical rehearsals to be coordinated with venue staff', 'Programmes must end by the agreed time'],
    rating: 0, reviewsCount: 0, isActive: true, isFeatured: true,
  },
];

/* ---------- Search vocabulary shared by the hero search and Explore filters ---------- */

export const AREAS = ['Whitefield', 'Hegde Nagar', 'KR Puram', 'Palace Grounds', 'Malleshwaram'];

export const EVENT_CATEGORIES: { label: string; keywords: string[] }[] = [
  { label: 'Weddings & Receptions', keywords: ['wedding', 'reception', 'engagement'] },
  { label: 'Concerts & Performances', keywords: ['concert', 'theatre', 'dance', 'cultural'] },
  { label: 'Corporate & Seminars', keywords: ['seminar', 'corporate', 'conclave', 'launch', 'award', 'offsite'] },
  { label: 'Family Celebrations', keywords: ['birthday', 'naming', 'family', 'reunion', 'party'] },
  { label: 'Community Gatherings', keywords: ['community', 'festival', 'literary', 'banquet'] },
  { label: 'Exhibitions', keywords: ['exhibition', 'expo'] },
];

export const hallMatchesCategory = (hall: Hall, label: string) => {
  const cat = EVENT_CATEGORIES.find((c) => c.label === label);
  if (!cat) return true;
  return hall.eventTypes.some((t) => cat.keywords.some((k) => t.toLowerCase().includes(k)));
};

/** Facility filters group related amenity ids together. */
export const FACILITY_FILTERS: { key: string; label: string; ids: string[] }[] = [
  { key: 'ac', label: 'Air conditioning', ids: ['ac'] },
  { key: 'parking', label: 'Parking', ids: ['parking'] },
  { key: 'av', label: 'Sound & AV', ids: ['av'] },
  { key: 'stage', label: 'Stage', ids: ['stage'] },
  { key: 'dining', label: 'Dining area', ids: ['dining'] },
  { key: 'backup', label: 'Power backup', ids: ['backup'] },
  { key: 'rooms', label: 'Green / changing rooms', ids: ['green_rooms', 'rooms', 'artist_rooms'] },
  { key: 'suites', label: 'Bridal / VIP rooms', ids: ['bridal_suites', 'vip_lounge'] },
];

export const hallHasFacility = (hall: Hall, key: string) => {
  const f = FACILITY_FILTERS.find((x) => x.key === key);
  return !!f && hall.amenities.some((a) => f.ids.includes(a.id));
};
