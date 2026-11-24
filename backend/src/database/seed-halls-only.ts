
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// 1. Resolve environment file: prefer .env, fallback to .env.production
const localEnvPath = path.resolve(__dirname, '../../.env');
const prodEnvPath = path.resolve(__dirname, '../../.env.production');

let resolvedEnvPath: string | null = null;
if (fs.existsSync(localEnvPath)) {
  resolvedEnvPath = localEnvPath;
  dotenv.config({ path: localEnvPath });
} else if (fs.existsSync(prodEnvPath)) {
  resolvedEnvPath = prodEnvPath;
  dotenv.config({ path: prodEnvPath });
} else {
  dotenv.config();
}

const databaseUrl = process.env.DATABASE_URL;

// 2. Validate existence
if (!databaseUrl || databaseUrl.trim() === '') {
  console.error('❌ Error: DATABASE_URL is missing or empty.');
  console.error(`Target env path resolved: ${resolvedEnvPath || '(default)'}`);
  process.exit(1);
}

// 3. Protocol Safety Validation: strictly require PostgreSQL, reject MySQL
if (databaseUrl.startsWith('mysql://')) {
  console.error('❌ Safety Error: DATABASE_URL points to MySQL. Refusing to connect to old MySQL database.');
  process.exit(1);
}

if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ Safety Error: DATABASE_URL must be a valid PostgreSQL connection URL.');
  process.exit(1);
}

// 4. Validate host safety: Reject localhost, 127.0.0.1, and legacy Aiven/Enzonic hosts
try {
  const parsed = new URL(databaseUrl);
  const hostname = parsed.hostname.toLowerCase();

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    console.error('❌ Safety Error: DATABASE_URL points to localhost/127.0.0.1.');
    console.error('Refusing to seed against a local database when production is expected.');
    process.exit(1);
  }

  if (hostname.includes('aivencloud.com') || hostname.includes('enzonic.com')) {
    console.error('❌ Safety Error: DATABASE_URL targets an old MySQL host (Aiven/Enzonic). Refusing to connect.');
    process.exit(1);
  }
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error('❌ Safety Error: Unable to parse DATABASE_URL host:', message);
  process.exit(1);
}

// 5. Explicitly bind datasource URL to PrismaClient to prevent fallback to .env
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

const amenitiesData = [
  { id: 'ac', name: 'Central Air Conditioning', category: 'comfort', icon: 'Wind' },
  { id: 'parking', name: 'On-site Dedicated Parking', category: 'infrastructure', icon: 'Car' },
  { id: 'av', name: 'Audio-Visual & Mic Setup', category: 'audio_visual', icon: 'Volume2' },
  { id: 'stage', name: 'Elevated Proscenium Stage', category: 'infrastructure', icon: 'Layers' },
  { id: 'dining', name: 'Dedicated Dining Hall', category: 'dining', icon: 'Utensils' },
  { id: 'backup', name: '100% DG Power Backup', category: 'infrastructure', icon: 'Zap' },
  { id: 'green_rooms', name: 'Air-Conditioned Green Rooms', category: 'comfort', icon: 'DoorClosed' },
  { id: 'bridal_suites', name: 'Luxury Bridal Suite', category: 'comfort', icon: 'Sparkles' },
  { id: 'vip_lounge', name: 'VIP Guest Lounge', category: 'comfort', icon: 'Sparkles' },
];

const hallsData = [
  {
    id: 'ecc-centre-whitefield',
    name: 'ECC Centre Community Hall',
    tagline: 'A calm, garden-set venue in Whitefield',
    address: 'Ecumenical Christian Centre, Post Box No. 11, Whitefield',
    area: 'Whitefield',
    city: 'Bengaluru',
    pincode: '560066',
    description:
      'Set within the leafy campus of the Ecumenical Christian Centre in Whitefield, this community hall suits seminars, cultural programmes, community gatherings and modest receptions. The surrounding greenery offers a quieter setting than most venues in the city’s technology corridor.',
    seatedCapacity: 500,
    floatingCapacity: 800,
    diningCapacity: 300,
    baseRatePerDay: 65000,
    hourlyRate: 8500,
    cleaningFee: 4500,
    depositRequired: 20000,
    notes: 'Demonstration pricing — confirm current tariff with the venue.',
    isActive: true,
    isFeatured: true,
    amenities: ['ac', 'parking', 'av', 'stage', 'dining', 'backup', 'green_rooms'],
    images: [
      { url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1600&q=80', isPrimary: true, order: 0 },
      { url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1600&q=80', isPrimary: false, order: 1 },
      { url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1600&q=80', isPrimary: false, order: 2 },
      { url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80', isPrimary: false, order: 3 },
    ],
  },
  {
    id: 'ebisu-convention-center',
    name: 'EBISU Convention Center',
    tagline: 'A large-format convention venue in north Bengaluru',
    address: 'Near Thanisandra Main Road, Hegde Nagar',
    area: 'Hegde Nagar',
    city: 'Bengaluru',
    pincode: '560077',
    description:
      'A convention venue in Hegde Nagar, north Bengaluru, used for weddings, receptions and corporate events. Its large hall works well for guest lists that outgrow neighbourhood community halls.',
    seatedCapacity: 1200,
    floatingCapacity: 2000,
    diningCapacity: 800,
    baseRatePerDay: 220000,
    hourlyRate: 25000,
    cleaningFee: 15000,
    depositRequired: 50000,
    notes: 'Demonstration pricing — confirm current tariff with the venue.',
    isActive: true,
    isFeatured: true,
    amenities: ['ac', 'parking', 'av', 'stage', 'dining', 'backup', 'bridal_suites'],
    images: [
      { url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80', isPrimary: true, order: 0 },
      { url: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=1600&q=80', isPrimary: false, order: 1 },
      { url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80', isPrimary: false, order: 2 },
      { url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1600&q=80', isPrimary: false, order: 3 },
    ],
  },
  {
    id: 'tarunn-grand-party-hall',
    name: 'Tarunn Grand Party Hall',
    tagline: 'An accessible party hall in KR Puram',
    address: 'Old Madras Road, Near Hanging Bridge, KR Puram',
    area: 'KR Puram',
    city: 'Bengaluru',
    pincode: '560036',
    description:
      'A party hall in KR Puram, east Bengaluru, suited to birthdays, engagements, naming ceremonies and family get-togethers. A practical, budget-conscious choice for mid-sized celebrations.',
    seatedCapacity: 250,
    floatingCapacity: 400,
    diningCapacity: 180,
    baseRatePerDay: 35000,
    hourlyRate: 4500,
    cleaningFee: 2500,
    depositRequired: 10000,
    notes: 'Demonstration pricing — confirm current tariff with the venue.',
    isActive: true,
    isFeatured: false,
    amenities: ['ac', 'parking', 'av', 'stage', 'dining', 'backup'],
    images: [
      { url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1600&q=80', isPrimary: true, order: 0 },
      { url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1600&q=80', isPrimary: false, order: 1 },
      { url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1600&q=80', isPrimary: false, order: 2 },
      { url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1600&q=80', isPrimary: false, order: 3 },
    ],
  },
  {
    id: 'gayatri-vihar-sagar',
    name: 'Gayatri Vihar Sagar',
    tagline: 'Expansive event grounds at Palace Grounds',
    address: 'Gate No. 4, Palace Grounds, Bellary Road, Sadashivanagar',
    area: 'Palace Grounds',
    city: 'Bengaluru',
    pincode: '560080',
    description:
      'Located at Bengaluru’s Palace Grounds, Gayatri Vihar is known for hosting large weddings, exhibitions and public events. Its scale makes it one of the options for gatherings in the thousands.',
    seatedCapacity: 2000,
    floatingCapacity: 4000,
    diningCapacity: 1200,
    baseRatePerDay: 380000,
    hourlyRate: 40000,
    cleaningFee: 25000,
    depositRequired: 75000,
    notes: 'Demonstration pricing — confirm current tariff with the venue.',
    isActive: true,
    isFeatured: true,
    amenities: ['ac', 'parking', 'av', 'stage', 'dining', 'backup', 'vip_lounge'],
    images: [
      { url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1600&q=80', isPrimary: true, order: 0 },
      { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80', isPrimary: false, order: 1 },
      { url: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1600&q=80', isPrimary: false, order: 2 },
      { url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80', isPrimary: false, order: 3 },
    ],
  },
  {
    id: 'chowdiah-memorial-hall',
    name: 'Chowdiah Memorial Hall',
    tagline: 'Bengaluru’s violin-shaped concert auditorium',
    address: '16th Cross, G.D. Park Extension, Vyalikaval, Malleshwaram',
    area: 'Malleshwaram',
    city: 'Bengaluru',
    pincode: '560003',
    description:
      'Built in the shape of a violin as a tribute to the violinist T. Chowdiah, this auditorium is one of Bengaluru’s best-known cultural landmarks. It is a long-standing venue for classical music, dance, theatre and cultural programmes.',
    seatedCapacity: 1000,
    floatingCapacity: 1000,
    diningCapacity: 0,
    baseRatePerDay: 95000,
    hourlyRate: 12000,
    cleaningFee: 6000,
    depositRequired: 25000,
    notes: 'Demonstration pricing — confirm current tariff with the venue.',
    isActive: true,
    isFeatured: true,
    amenities: ['ac', 'parking', 'av', 'stage', 'backup', 'green_rooms'],
    images: [
      { url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1600&q=80', isPrimary: true, order: 0 },
      { url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80', isPrimary: false, order: 1 },
      { url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1600&q=80', isPrimary: false, order: 2 },
      { url: 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1600&q=80', isPrimary: false, order: 3 },
    ],
  },
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing. Check backend/.env.');
  }

  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    throw new Error(
      'Unexpected database URL type. Expected postgresql:// or postgres://.',
    );
  }

  console.log('Starting safe hall-only seed...');
  console.log(`Halls to check: ${hallsData.length}`);
  console.log(`Amenities to check: ${amenitiesData.length}`);

  // Create missing amenities. Existing amenities remain unchanged.
  for (const amenity of amenitiesData) {
    await prisma.amenity.upsert({
      where: { id: amenity.id },
      update: {},
      create: amenity,
    });
  }

  console.log('Amenities checked.');

  // Create missing halls. Existing halls are never overwritten.
  for (const hall of hallsData) {
    const { amenities, images, ...hallFields } = hall;

    const existingHall = await prisma.hall.findUnique({
      where: { id: hall.id },
    });

    if (!existingHall) {
      await prisma.hall.create({
        data: hallFields,
      });

      console.log(`Created hall: ${hall.name}`);
    } else {
      console.log(`Hall already exists; left unchanged: ${hall.name}`);
    }

    // Add missing hall-amenity relationships.
    for (const amenityId of amenities) {
      const existingRelation = await prisma.hallAmenity.findFirst({
        where: {
          hallId: hall.id,
          amenityId,
        },
      });

      if (!existingRelation) {
        await prisma.hallAmenity.create({
          data: {
            hallId: hall.id,
            amenityId,
          },
        });
      }
    }

    // Add missing images without deleting existing images.
    for (const image of images) {
      const existingImage = await prisma.hallImage.findFirst({
        where: {
          hallId: hall.id,
          imageUrl: image.url,
        },
      });

      if (!existingImage) {
        await prisma.hallImage.create({
          data: {
            hallId: hall.id,
            imageUrl: image.url,
            isPrimary: image.isPrimary,
            sortOrder: image.order,
          },
        });
      }
    }

    console.log(`Checked amenities and images: ${hall.name}`);
  }

  console.log('Safe hall-only seed completed successfully.');
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Safe hall-only seed failed:', message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
