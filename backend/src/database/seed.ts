import { PrismaClient, Role, BookingStatus, MaintenanceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting database seeding for community_hall_management_v2...');

  // 1. Seed Default Demo Users with bcrypt hashes
  const adminPasswordHash = await bcrypt.hash('AdminPass@2026', 10);
  const customerPasswordHash = await bcrypt.hash('Customer@2026', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sabhahalls.in' },
    update: {},
    create: {
      email: 'admin@sabhahalls.in',
      name: 'Hall Administrator',
      passwordHash: adminPasswordHash,
      phone: '+91 80 4920 1800',
      role: Role.ADMIN,
      organization: 'Bengaluru Civic Venues Authority',
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: 'rohit.shenoy@example.com' },
    update: {},
    create: {
      email: 'rohit.shenoy@example.com',
      name: 'Rohit Shenoy',
      passwordHash: customerPasswordHash,
      phone: '+91 98450 12345',
      role: Role.CUSTOMER,
      organization: 'Shenoy Family Celebrations',
    },
  });

  console.log(`[Seed] Seeded Users: ${adminUser.email} (ADMIN), ${customerUser.email} (CUSTOMER)`);

  // 2. Seed Master Amenities
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

  for (const am of amenitiesData) {
    await prisma.amenity.upsert({
      where: { id: am.id },
      update: { name: am.name, category: am.category, icon: am.icon },
      create: am,
    });
  }

  // 3. Seed The Five Authentic Bengaluru Halls
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

  for (const h of hallsData) {
    const { amenities, images, ...hallFields } = h;

    await prisma.hall.upsert({
      where: { id: h.id },
      update: hallFields,
      create: hallFields,
    });

    // Clean and associate amenities idempotently
    await prisma.hallAmenity.deleteMany({ where: { hallId: h.id } });
    for (const amId of amenities) {
      await prisma.hallAmenity.create({
        data: { hallId: h.id, amenityId: amId },
      });
    }

    // Clean and associate images idempotently
    await prisma.hallImage.deleteMany({ where: { hallId: h.id } });
    for (const img of images) {
      await prisma.hallImage.create({
        data: {
          hallId: h.id,
          imageUrl: img.url,
          isPrimary: img.isPrimary,
          sortOrder: img.order,
        },
      });
    }

    console.log(`[Seed] Seeded Hall: ${h.name} (${h.area})`);
  }

  // 4. Seed Initial Demonstration Maintenance Blackouts
  const maintenanceData = [
    {
      id: 'MT-101',
      hallId: 'chowdiah-memorial-hall',
      startDate: '2026-11-24',
      endDate: '2026-11-25',
      description: 'Stage floor refinishing and acoustic sensor calibration.',
      status: MaintenanceStatus.SCHEDULED,
    },
    {
      id: 'MT-102',
      hallId: 'gayatri-vihar-sagar',
      startDate: '2026-11-29',
      endDate: '2026-12-01',
      description: 'Industrial 50-Ton central HVAC chiller servicing.',
      status: MaintenanceStatus.SCHEDULED,
    },
  ];

  for (const m of maintenanceData) {
    await prisma.maintenanceSchedule.upsert({
      where: { id: m.id },
      update: m,
      create: m,
    });
  }

  // 5. Seed Initial Demonstration Bookings
  const demoBookings = [
    {
      id: 'BK-101',
      hallId: 'ecc-centre-whitefield',
      userId: customerUser.id,
      eventType: 'Academic Seminars',
      eventDate: '2026-11-20',
      startTime: '09:00',
      endTime: '17:00',
      guestsCount: 420,
      contactName: 'Rohit Shenoy',
      contactEmail: 'rohit.shenoy@example.com',
      contactPhone: '+91 98450 12345',
      specialRequests: 'Podium microphone and projection setup for keynote.',
      status: BookingStatus.APPROVED,
      totalAmount: 69500,
    },
    {
      id: 'BK-102',
      hallId: 'ebisu-convention-center',
      userId: customerUser.id,
      eventType: 'Grand Weddings',
      eventDate: '2026-12-14',
      startTime: '08:00',
      endTime: '23:00',
      guestsCount: 1400,
      contactName: 'Rohit Shenoy',
      contactEmail: 'rohit.shenoy@example.com',
      contactPhone: '+91 98450 12345',
      specialRequests: 'Valet parking coordination for 400 cars.',
      status: BookingStatus.PENDING,
      totalAmount: 235000,
    },
    {
      id: 'BK-103',
      hallId: 'tarunn-grand-party-hall',
      userId: customerUser.id,
      eventType: 'Family Celebrations',
      eventDate: '2026-11-28',
      startTime: '11:00',
      endTime: '16:00',
      guestsCount: 200,
      contactName: 'Deepa Hegde',
      contactEmail: 'deepa.hegde@example.com',
      contactPhone: '+91 99000 11223',
      specialRequests: 'Vegetarian buffet arrangement.',
      status: BookingStatus.PENDING,
      totalAmount: 37500,
    },
  ];

  for (const b of demoBookings) {
    await prisma.booking.upsert({
      where: { id: b.id },
      update: b,
      create: b,
    });
  }

  console.log('[Seed] Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('[Seed Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
