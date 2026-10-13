require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../src/models/User');
const Farm = require('../src/models/Farm');
const Prediction = require('../src/models/Prediction');

const DEMO_USER = {
  name: 'Aarav Sharma',
  email: 'demo.farmer@example.com',
  phone: '9000000001',
  password: 'DemoPass123',
  pushEnabled: true,
  emailEnabled: true,
  createdAt: new Date('2026-01-15T09:00:00.000Z')
};

const createBoundary = (longitude, latitude, offset = 0.006) => [[
  [longitude - offset, latitude - offset],
  [longitude + offset, latitude - offset],
  [longitude + offset, latitude + offset],
  [longitude - offset, latitude + offset],
  [longitude - offset, latitude - offset]
]];

const seedDemoData = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Add it to backend/.env before seeding.');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  let user = await User.findOne({ email: DEMO_USER.email }).select('+password');
  if (user) {
    Object.assign(user, DEMO_USER);
    await user.save();
  } else {
    user = await User.create(DEMO_USER);
  }

  // The seed is repeatable: only records owned by the dedicated demo account are replaced.
  await Prediction.deleteMany({ user: user._id });
  await Farm.deleteMany({ user: user._id });

  const farms = await Farm.insertMany([
    {
      user: user._id,
      name: 'Green Valley Rice Field',
      location: { type: 'Point', coordinates: [77.2090, 28.6139] },
      boundary: { type: 'Polygon', coordinates: createBoundary(77.2090, 28.6139) },
      area: 2.5,
      cropType: 'Rice',
      createdAt: new Date('2026-02-01T08:30:00.000Z')
    },
    {
      user: user._id,
      name: 'Sunrise Wheat Farm',
      location: { type: 'Point', coordinates: [77.2500, 28.6400] },
      boundary: { type: 'Polygon', coordinates: createBoundary(77.2500, 28.6400, 0.004) },
      area: 1.8,
      cropType: 'Wheat',
      createdAt: new Date('2026-02-10T07:45:00.000Z')
    },
    {
      user: user._id,
      name: 'Riverbend Maize Plot',
      location: { type: 'Point', coordinates: [77.1800, 28.5900] },
      boundary: { type: 'Polygon', coordinates: createBoundary(77.1800, 28.5900, 0.005) },
      area: 3.2,
      cropType: 'Maize',
      createdAt: new Date('2026-02-18T10:15:00.000Z')
    }
  ]);

  await Prediction.insertMany([
    {
      farm: farms[0]._id,
      user: user._id,
      recommendedCrop: 'Rice',
      fertilizerRecommendations: ['Apply 45 kg nitrogen per hectare', 'Add organic compost before transplanting'],
      irrigationSchedule: 'Maintain 2–5 cm standing water; inspect moisture every 3 days.',
      aiConfidenceScore: 0.95,
      predictedYield: 4.82,
      crop: 'Rice',
      N: 82,
      P: 41,
      K: 39,
      pH: 6.5,
      weatherContext: { temperature: 28.4, humidity: 72, rainfall: 18.6 },
      date: new Date('2026-08-12T09:30:00.000Z')
    },
    {
      farm: farms[1]._id,
      user: user._id,
      recommendedCrop: 'Wheat',
      fertilizerRecommendations: ['Apply 60 kg nitrogen per hectare in two splits', 'Use phosphorus-rich basal fertilizer'],
      irrigationSchedule: 'Irrigate at crown-root initiation and flowering stages.',
      aiConfidenceScore: 0.92,
      predictedYield: 4.15,
      crop: 'Wheat',
      N: 76,
      P: 38,
      K: 34,
      pH: 7.1,
      weatherContext: { temperature: 22.8, humidity: 58, rainfall: 4.1 },
      date: new Date('2026-07-28T11:15:00.000Z')
    },
    {
      farm: farms[2]._id,
      user: user._id,
      recommendedCrop: 'Maize',
      fertilizerRecommendations: ['Apply 120 kg nitrogen per hectare in three splits', 'Maintain potassium availability during tasseling'],
      irrigationSchedule: 'Irrigate every 7 days during dry weather; increase frequency at tasseling.',
      aiConfidenceScore: 0.94,
      predictedYield: 5.67,
      crop: 'Maize',
      N: 91,
      P: 45,
      K: 42,
      pH: 6.8,
      weatherContext: { temperature: 30.1, humidity: 66, rainfall: 9.8 },
      date: new Date('2026-07-15T14:00:00.000Z')
    },
    {
      farm: farms[0]._id,
      user: user._id,
      recommendedCrop: 'Rice',
      fertilizerRecommendations: ['Top-dress nitrogen after tillering', 'Monitor zinc availability in lowland soil'],
      irrigationSchedule: 'Drain the field 10 days before harvest.',
      aiConfidenceScore: 0.91,
      predictedYield: 4.46,
      crop: 'Rice',
      N: 74,
      P: 36,
      K: 37,
      pH: 6.3,
      weatherContext: { temperature: 27.2, humidity: 76, rainfall: 31.4 },
      date: new Date('2026-06-30T08:00:00.000Z')
    }
  ]);

  console.log(`Seeded 1 user, ${farms.length} farms, and 4 predictions.`);
  console.log(`Demo login: ${DEMO_USER.email} / ${DEMO_USER.password}`);
};

seedDemoData()
  .catch((error) => {
    console.error('Demo-data seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
