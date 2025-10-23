/**
 * Database Seeding Script
 * Initializes database with default printers, materials, and slicer config
 *
 * Usage: npm run seed
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Printer } from '../models/printer.js';
import { Material } from '../models/material.js';
import { SlicerConfig, DEFAULT_SLICER_SETTINGS } from '../models/slicerConfig.js';
import { User } from '../models/user.js';

dotenv.config();

const ADMIN_USER_ID = new mongoose.Types.ObjectId();

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aipms';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    // Create admin user if not exists
    let adminUser = await User.findOne({ email: 'admin@aipms.local' });
    if (!adminUser) {
      adminUser = new User({
        _id: ADMIN_USER_ID,
        email: 'admin@aipms.local',
        password: 'Admin123!@#',
        name: 'System Administrator',
        role: 'admin',
        isActive: true,
        emailVerified: true,
      });
      await adminUser.save();
      console.log('✓ Created admin user');
      console.log('  Email: admin@aipms.local');
      console.log('  Password: Admin123!@#\n');
    } else {
      console.log('⚠  Admin user already exists\n');
    }

    // Seed Printers
    console.log('📦 Seeding printers...');
    const printersData = [
      {
        name: 'Creality Ender 3 V2',
        manufacturer: 'Creality',
        model: 'Ender 3 V2',
        buildVolume: { x: 220, y: 220, z: 250 },
        nozzle: { diameter: 0.4, availableSizes: [0.2, 0.4, 0.6, 0.8] },
        extruder: { count: 1, type: 'bowden' },
        maxSpeed: { x: 150, y: 150, z: 10, e: 45 },
        maxAcceleration: { x: 500, y: 500, z: 100, e: 1000 },
        bed: { type: 'heated', maxTemp: 100, shape: 'rectangular', material: 'glass' },
        autoLeveling: false,
        firmware: 'Marlin',
        features: {
          filamentSensor: false,
          powerRecovery: true,
          enclosure: false,
          hepa: false,
          camera: false,
        },
        gcodeFlavor: 'marlin',
        isDefault: true,
        createdBy: adminUser!._id,
      },
      {
        name: 'Prusa i3 MK3S+',
        manufacturer: 'Prusa Research',
        model: 'i3 MK3S+',
        buildVolume: { x: 250, y: 210, z: 210 },
        nozzle: { diameter: 0.4, availableSizes: [0.25, 0.4, 0.6, 0.8] },
        extruder: { count: 1, type: 'direct' },
        maxSpeed: { x: 200, y: 200, z: 12, e: 80 },
        maxAcceleration: { x: 1000, y: 1000, z: 200, e: 1500 },
        bed: { type: 'heated', maxTemp: 120, shape: 'rectangular', material: 'PEI' },
        autoLeveling: true,
        levelingType: 'Inductive',
        firmware: 'Marlin',
        features: {
          filamentSensor: true,
          powerRecovery: true,
          enclosure: false,
          hepa: false,
          camera: false,
        },
        gcodeFlavor: 'marlin',
        createdBy: adminUser!._id,
      },
      {
        name: 'Creality CR-10',
        manufacturer: 'Creality',
        model: 'CR-10',
        buildVolume: { x: 300, y: 300, z: 400 },
        nozzle: { diameter: 0.4, availableSizes: [0.2, 0.4, 0.6, 0.8, 1.0] },
        extruder: { count: 1, type: 'bowden' },
        maxSpeed: { x: 150, y: 150, z: 10, e: 50 },
        maxAcceleration: { x: 500, y: 500, z: 100, e: 1000 },
        bed: { type: 'heated', maxTemp: 110, shape: 'rectangular', material: 'glass' },
        autoLeveling: false,
        firmware: 'Marlin',
        features: {
          filamentSensor: false,
          powerRecovery: false,
          enclosure: false,
          hepa: false,
          camera: false,
        },
        gcodeFlavor: 'marlin',
        createdBy: adminUser!._id,
      },
    ];

    await Printer.deleteMany({});
    await Printer.insertMany(printersData);
    console.log(`✓ Created ${printersData.length} printers\n`);

    // Seed Materials
    console.log('🎨 Seeding materials...');
    const materialsData = [
      {
        name: 'PLA Standard',
        type: 'PLA',
        temperature: {
          nozzle: 200,
          nozzleMin: 190,
          nozzleMax: 220,
          bed: 60,
          bedMin: 50,
          bedMax: 70,
        },
        speed: {
          print: 60,
          infill: 80,
          wall: 50,
          topBottom: 50,
          support: 60,
          travel: 150,
          firstLayer: 20,
        },
        cooling: {
          minFanSpeed: 0,
          maxFanSpeed: 100,
          regularFanSpeed: 100,
          bridgeFanSpeed: 100,
          disableFirstLayers: 1,
        },
        retraction: {
          enabled: true,
          distance: 5,
          speed: 45,
          extraRestart: 0,
          minTravel: 1.5,
          zHop: 0.2,
        },
        properties: {
          density: 1.24,
          diameter: 1.75,
          flowRate: 100,
          shrinkage: 0.3,
        },
        adhesion: {
          type: 'skirt',
        },
        characteristics: {
          strength: 6,
          flexibility: 3,
          durability: 5,
          printability: 9,
          supportRemoval: 8,
          postProcessing: 7,
        },
        requirements: {
          enclosure: false,
          heatbed: true,
          allMetalHotend: false,
          dryingRequired: false,
          ventilation: false,
        },
        isDefault: true,
        createdBy: adminUser!._id,
      },
      {
        name: 'ABS Standard',
        type: 'ABS',
        temperature: {
          nozzle: 240,
          nozzleMin: 220,
          nozzleMax: 260,
          bed: 100,
          bedMin: 90,
          bedMax: 110,
          chamber: 40,
        },
        speed: {
          print: 50,
          infill: 60,
          wall: 40,
          topBottom: 40,
          support: 50,
          travel: 150,
          firstLayer: 15,
        },
        cooling: {
          minFanSpeed: 0,
          maxFanSpeed: 50,
          regularFanSpeed: 30,
          bridgeFanSpeed: 80,
          disableFirstLayers: 3,
        },
        retraction: {
          enabled: true,
          distance: 5,
          speed: 45,
          extraRestart: 0,
          minTravel: 1.5,
          zHop: 0.2,
        },
        properties: {
          density: 1.04,
          diameter: 1.75,
          flowRate: 100,
          shrinkage: 0.8,
        },
        adhesion: {
          type: 'brim',
          brimWidth: 8,
        },
        characteristics: {
          strength: 8,
          flexibility: 4,
          durability: 8,
          printability: 5,
          supportRemoval: 6,
          postProcessing: 8,
        },
        requirements: {
          enclosure: true,
          heatbed: true,
          allMetalHotend: false,
          dryingRequired: true,
          ventilation: true,
        },
        warningMessage: 'ABS emits fumes during printing. Use in well-ventilated area.',
        createdBy: adminUser!._id,
      },
      {
        name: 'PETG Standard',
        type: 'PETG',
        temperature: {
          nozzle: 235,
          nozzleMin: 220,
          nozzleMax: 250,
          bed: 80,
          bedMin: 70,
          bedMax: 90,
        },
        speed: {
          print: 50,
          infill: 60,
          wall: 40,
          topBottom: 40,
          support: 50,
          travel: 150,
          firstLayer: 18,
        },
        cooling: {
          minFanSpeed: 0,
          maxFanSpeed: 80,
          regularFanSpeed: 50,
          bridgeFanSpeed: 100,
          disableFirstLayers: 2,
        },
        retraction: {
          enabled: true,
          distance: 6,
          speed: 40,
          extraRestart: 0,
          minTravel: 2.0,
          zHop: 0.3,
        },
        properties: {
          density: 1.27,
          diameter: 1.75,
          flowRate: 100,
          shrinkage: 0.5,
        },
        adhesion: {
          type: 'skirt',
        },
        characteristics: {
          strength: 8,
          flexibility: 5,
          durability: 9,
          printability: 7,
          supportRemoval: 6,
          postProcessing: 6,
        },
        requirements: {
          enclosure: false,
          heatbed: true,
          allMetalHotend: false,
          dryingRequired: true,
          ventilation: false,
        },
        createdBy: adminUser!._id,
      },
      {
        name: 'TPU Flexible',
        type: 'TPU',
        temperature: {
          nozzle: 220,
          nozzleMin: 210,
          nozzleMax: 235,
          bed: 50,
          bedMin: 40,
          bedMax: 60,
        },
        speed: {
          print: 30,
          infill: 35,
          wall: 25,
          topBottom: 25,
          support: 30,
          travel: 120,
          firstLayer: 15,
        },
        cooling: {
          minFanSpeed: 50,
          maxFanSpeed: 100,
          regularFanSpeed: 80,
          bridgeFanSpeed: 100,
          disableFirstLayers: 1,
        },
        retraction: {
          enabled: true,
          distance: 2,
          speed: 30,
          extraRestart: 0,
          minTravel: 2.0,
          zHop: 0,
        },
        properties: {
          density: 1.21,
          diameter: 1.75,
          flowRate: 100,
          shrinkage: 1.0,
        },
        adhesion: {
          type: 'brim',
          brimWidth: 5,
        },
        characteristics: {
          strength: 5,
          flexibility: 10,
          durability: 7,
          printability: 4,
          supportRemoval: 5,
          postProcessing: 3,
        },
        requirements: {
          enclosure: false,
          heatbed: false,
          allMetalHotend: false,
          dryingRequired: true,
          ventilation: false,
        },
        notes: 'Best printed with direct drive extruder. Reduce speed significantly.',
        createdBy: adminUser!._id,
      },
    ];

    await Material.deleteMany({});
    await Material.insertMany(materialsData);
    console.log(`✓ Created ${materialsData.length} materials\n`);

    // Seed Slicer Configuration
    console.log('⚙️  Seeding slicer configuration...');
    const configData = {
      name: 'Default Configuration',
      description: 'Complete slicer settings with all available parameters',
      version: '1.0.0',
      settings: DEFAULT_SLICER_SETTINGS,
      isDefault: true,
      createdBy: adminUser!._id,
    };

    await SlicerConfig.deleteMany({});
    await SlicerConfig.create(configData);
    console.log(`✓ Created slicer configuration with ${DEFAULT_SLICER_SETTINGS.length} settings\n`);

    console.log('✅ Database seeding completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`  - ${printersData.length} printers`);
    console.log(`  - ${materialsData.length} materials`);
    console.log(`  - 1 slicer configuration (${DEFAULT_SLICER_SETTINGS.length} settings)`);
    console.log(`  - 1 admin user\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
