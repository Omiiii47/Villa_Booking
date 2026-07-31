const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Villa = require('../models/Villa');
const Amenity = require('../models/Amenity');
const User = require('../models/User');

dotenv.config();

const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const villas = [
  {
    name: 'The Grand Horizon',
    shortDescription: 'A breathtaking cliffside retreat with panoramic ocean views',
    description: 'Perched on the edge of a dramatic cliff, The Grand Horizon offers an unparalleled experience of luxury living above the sea. Floor-to-ceiling windows frame endless ocean vistas, while infinity pools blend seamlessly with the horizon. Every detail, from the hand-carved stone bathtubs to the private rooftop observatory, has been crafted to inspire wonder.',
    pricePerNight: 2500,
    capacity: 8,
    bedrooms: 4,
    bathrooms: 5,
    size: '4500 sq ft',
    location: 'Cliffside Bay',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200',
    ],
    amenities: ['Infinity Pool', 'Ocean View', 'Private Chef', 'Spa', 'Wine Cellar', 'Home Theater', 'Gym', 'Helipad'],
    featured: true,
    rating: 4.9,
    numReviews: 24,
  },
  {
    name: 'The Emerald Canopy',
    shortDescription: 'A treetop sanctuary immersed in ancient rainforest',
    description: 'Suspended among the towering trees of an ancient rainforest, The Emerald Canopy redefines the concept of treehouse luxury. Accessible via a private canopy bridge, each suite opens to the symphony of the forest. A cascading pool descends through the treetops, and open-air pavilions invite you to dine beneath the stars.',
    pricePerNight: 1800,
    capacity: 6,
    bedrooms: 3,
    bathrooms: 4,
    size: '3200 sq ft',
    location: 'Rainforest Reserve',
    images: [
      'https://images.unsplash.com/photo-1615571022219-eb45cf7faa36?w=1200',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200',
    ],
    amenities: ['Canopy Pool', 'Forest Spa', 'Yoga Pavilion', 'Private Guide', 'Outdoor Shower', 'Fire Pit', 'Hammock Garden'],
    featured: true,
    rating: 4.8,
    numReviews: 18,
  },
  {
    name: 'Azure Cove Villa',
    shortDescription: 'Private beachfront paradise with crystalline waters',
    description: 'Step directly onto powder-soft sands from your private terrace at Azure Cove Villa. This beachfront masterpiece combines indoor-outdoor living with a seamless flow of spaces. Coral stone pathways wind through tropical gardens to a private cove, while the open-plan great room captures the ocean breeze from every angle.',
    pricePerNight: 3200,
    capacity: 10,
    bedrooms: 5,
    bathrooms: 6,
    size: '5500 sq ft',
    location: 'Azure Beach',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
      'https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=1200',
      'https://images.unsplash.com/photo-1600607687644-cd4f1e1b1b1a?w=1200',
    ],
    amenities: ['Private Beach', 'Infinity Pool', 'Tennis Court', 'Boat Dock', 'Outdoor Kitchen', 'Beach Bar', 'Water Sports', 'Library'],
    featured: true,
    rating: 5.0,
    numReviews: 31,
  },
  {
    name: 'The Mountain Aerie',
    shortDescription: 'A lofty alpine escape with sweeping mountain views',
    description: 'Nestled in the high alpine meadows, The Mountain Aerie is a sanctuary of warmth and sophistication. Massive stone fireplaces anchor the great room, while floor-to-ceiling retractable walls open to terraces overlooking snow-capped peaks. A private spa wing offers hot springs and treatment rooms carved into the mountainside.',
    pricePerNight: 2200,
    capacity: 8,
    bedrooms: 4,
    bathrooms: 5,
    size: '4200 sq ft',
    location: 'Alpine Heights',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
      'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=1200',
      'https://images.unsplash.com/photo-1600566753086-00f18f6b8a1a?w=1200',
    ],
    amenities: ['Hot Springs', 'Ski-in/Ski-out', 'Wine Grotto', 'Game Room', 'Library', 'Sauna', 'Steam Room', 'Fireplace'],
    featured: true,
    rating: 4.7,
    numReviews: 15,
  },
  {
    name: 'The Desert Mirage',
    shortDescription: 'An exclusive desert oasis blending modern luxury with ancient landscapes',
    description: 'Set against a backdrop of sculpted sand dunes, The Desert Mirage is a study in contrasts — cutting-edge architecture rising from the ancient desert floor. Cool plunge pools reflect the endless sky, while shaded courtyards and verandas offer refuge from the sun. Evening transforms the landscape with fire features and starlit dining.',
    pricePerNight: 1900,
    capacity: 6,
    bedrooms: 3,
    bathrooms: 4,
    size: '3800 sq ft',
    location: 'Dunes Reserve',
    images: [
      'https://images.unsplash.com/photo-1600566752229-250ed794c70d?w=1200',
      'https://images.unsplash.com/photo-1600573472556-5b1b5f1b1b1b?w=1200',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200',
    ],
    amenities: ['Plunge Pool', 'Stargazing Deck', 'Private Spa', 'Desert Tours', 'Outdoor Cinema', 'Fire Pit', 'Tennis Court'],
    featured: false,
    rating: 4.6,
    numReviews: 12,
  },
  {
    name: 'The Zen Pavilion',
    shortDescription: 'A tranquil Japanese-inspired retreat embracing minimalist perfection',
    description: 'Inspired by the principles of wabi-sabi, The Zen Pavilion celebrates imperfection and tranquility. Koi ponds reflect the changing skies, while sliding shoji screens reveal meditation gardens and tea ceremony rooms. Natural materials — untreated cedar, hand-troweled plaster, volcanic stone — create a palette of earthy serenity.',
    pricePerNight: 1600,
    capacity: 4,
    bedrooms: 2,
    bathrooms: 3,
    size: '2800 sq ft',
    location: 'Bamboo Valley',
    images: [
      'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=1200',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
      'https://images.unsplash.com/photo-1600607687644-cd4f1e1b1b1a?w=1200',
    ],
    amenities: ['Meditation Garden', 'Tea House', 'Onsen', 'Bamboo Forest', 'Yoga Studio', 'Koi Pond', 'Sake Bar'],
    featured: false,
    rating: 4.9,
    numReviews: 21,
  },
  {
    name: 'Sunset Cliffs Estate',
    shortDescription: 'Mediterranean-inspired villa perched above the sunset coast',
    description: 'Overlooking the legendary sunsets of the western coast, this Mediterranean estate combines old-world charm with contemporary luxury. White-washed walls, terracotta rooftops, and bougainvillea-draped pergolas create an atmosphere of timeless elegance. A private path leads to a secluded cove for evening swims.',
    pricePerNight: 2700,
    capacity: 10,
    bedrooms: 5,
    bathrooms: 6,
    size: '5200 sq ft',
    location: 'Sunset Coast',
    images: [
      'https://images.unsplash.com/photo-1600566753086-00f18f6b8a1a?w=1200',
      'https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=1200',
      'https://images.unsplash.com/photo-1615571022219-eb45cf7faa36?w=1200',
    ],
    amenities: ['Cliffside Pool', 'Mediterranean Garden', 'Wine Cellar', 'Outdoor Dining', 'Pizza Oven', 'Library', 'Sunset Deck'],
    featured: false,
    rating: 4.8,
    numReviews: 27,
  },
  {
    name: 'The Glass House',
    shortDescription: 'A crystalline masterpiece floating above the forest floor',
    description: 'The Glass House is an architectural marvel — a transparent pavilion seemingly suspended above the forest floor. Mirror-polished surfaces reflect the changing seasons, while the all-glass structure dissolves the boundary between inside and out. At night, the house glows like a lantern among the trees.',
    pricePerNight: 2100,
    capacity: 6,
    bedrooms: 3,
    bathrooms: 4,
    size: '3600 sq ft',
    location: 'Forest Canopy',
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200',
    ],
    amenities: ['Glass Pool', 'Rooftop Terrace', 'Art Studio', 'Wine Fridge', 'Smart Home', 'Acoustic System', 'Infinity Edge'],
    featured: false,
    rating: 4.7,
    numReviews: 14,
  },
];

const amenities = [
  { name: 'Infinity Pool', icon: 'FaSwimmer', description: 'Heated infinity edge pool with panoramic views' },
  { name: 'Private Chef', icon: 'FaUtensils', description: 'In-villa dining with personal chef service' },
  { name: 'Spa & Wellness', icon: 'FaSpa', description: 'Full-service spa with massage and treatments' },
  { name: 'Wine Cellar', icon: 'FaWineBottle', description: 'Curated wine selection and sommelier service' },
  { name: 'Private Beach', icon: 'FaUmbrellaBeach', description: 'Exclusive beach access with loungers and service' },
  { name: 'Yoga Pavilion', icon: 'FaPray', description: 'Daily yoga and meditation sessions' },
  { name: 'Home Theater', icon: 'FaFilm', description: 'State-of-the-art cinema with premium seating' },
  { name: 'Helipad', icon: 'FaHelicopter', description: 'Private helicopter landing facility' },
  { name: 'Boat Dock', icon: 'FaShip', description: 'Private dock with boat and water toy rentals' },
  { name: 'Stargazing Deck', icon: 'FaStar', description: 'Observatory deck with telescope' },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await Villa.deleteMany({});
    await Amenity.deleteMany({});

    await Villa.create(villas.map(v => ({ ...v, slug: slugify(v.name) })));
    await Amenity.insertMany(amenities);

    const adminExists = await User.findOne({ email: 'admin@villabooking.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: 'admin@villabooking.com',
        password: 'admin123',
        role: 'admin',
      });
    }

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
