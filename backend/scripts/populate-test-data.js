/**
 * Script to populate MStress database with test data
 * Usage: node populate-test-data.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Assessment = require('../models/Assessment');
const Review = require('../models/Review');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mstress';

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✓ Connected to MongoDB');
  populateTestData();
}).catch(err => {
  console.error('✗ MongoDB connection error:', err);
  process.exit(1);
});

// Test data
const indianNames = [
  'Rajesh Kumar', 'Priya Singh', 'Amit Patel', 'Neha Sharma', 'Vikram Reddy',
  'Anjali Gupta', 'Arjun Nair', 'Divya Iyer', 'Rohan Desai', 'Pooja Verma',
  'Sanjay Rao', 'Kavya Menon', 'Aditya Joshi', 'Sneha Bhat', 'Nikhil Chopra',
  'Isha Kapoor', 'Varun Malhotra', 'Zara Khan', 'Akshay Sharma', 'Ritika Saxena'
];

const assessmentTypes = ['standard', 'advanced', 'detailed_stress', 'multi_modal'];
const stressLevels = ['low', 'moderate', 'high', 'severe'];

async function populateTestData() {
  try {
    console.log('\n📊 Starting test data population...\n');

    // Step 1: Create Reviewer Account
    console.log('Step 1: Creating reviewer account...');
    const reviewer = await createOrUpdateUser({
      email: 'reviewer@mstress.com',
      password: 'reviewer123',
      name: 'Mridankan Mandal',
      role: 'human_reviewer'
    });
    console.log('✓ Reviewer created:', reviewer.email);

    // Step 2: Create Admin Account
    console.log('\nStep 2: Creating admin account...');
    const admin = await createOrUpdateUser({
      email: 'admin@mstress.com',
      password: 'admin123',
      name: 'System Administrator',
      role: 'admin'
    });
    console.log('✓ Admin created:', admin.email);

    // Step 3: Create Regular Users
    console.log('\nStep 3: Creating 15 regular users...');
    const users = [];
    for (let i = 0; i < 15; i++) {
      const user = await createOrUpdateUser({
        email: `user${i + 1}@example.com`,
        password: 'password123',
        name: indianNames[i],
        role: 'user',
        isActive: i % 3 !== 0 // Some inactive users
      });
      users.push(user);
    }
    console.log(`✓ Created ${users.length} regular users`);

    // Step 4: Create Assessments
    console.log('\nStep 4: Creating 15 assessments...');
    const assessments = [];
    for (let i = 0; i < 15; i++) {
      const user = users[i % users.length];
      const assessment = new Assessment({
        user: user._id,
        type: assessmentTypes[i % assessmentTypes.length],
        status: i % 3 === 0 ? 'in_progress' : 'completed',
        results: {
          overallScore: Math.floor(Math.random() * 100),
          stressLevel: stressLevels[Math.floor(Math.random() * stressLevels.length)],
          confidence: Math.random() * 0.5 + 0.5,
          categoryScores: {
            workStress: Math.floor(Math.random() * 42),
            personalLife: Math.floor(Math.random() * 42),
            physicalHealth: Math.floor(Math.random() * 42),
            sleepQuality: Math.floor(Math.random() * 42),
            socialRelationships: Math.floor(Math.random() * 42),
            academicStress: Math.floor(Math.random() * 42)
          },
          insights: {
            strengths: ['Good coping mechanisms', 'Strong support network'],
            concerns: ['Work-related stress', 'Sleep issues'],
            riskFactors: ['High workload', 'Limited social interaction']
          }
        },
        metadata: {
          duration: Math.floor(Math.random() * 1800) + 300,
          deviceInfo: {
            userAgent: 'Mozilla/5.0',
            platform: 'Windows',
            screenResolution: '1920x1080'
          },
          aiModelsUsed: ['RoBERTa', 'Whisper', 'LibreFace'],
          processingTime: Math.floor(Math.random() * 5000) + 1000
        },
        completedAt: i % 3 === 0 ? null : new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)
      });
      await assessment.save();
      assessments.push(assessment);
    }
    console.log(`✓ Created ${assessments.length} assessments`);

    // Step 5: Create Reviews
    console.log('\nStep 5: Creating 10 reviews...');
    for (let i = 0; i < 10; i++) {
      const assessment = assessments[i];
      const review = new Review({
        assessment: assessment._id,
        reviewer: reviewer._id,
        status: ['pending', 'reviewed', 'approved'][i % 3],
        reviewScore: Math.floor(Math.random() * 100),
        comments: `Assessment review for ${assessment.type}. Patient shows ${assessment.results.stressLevel} stress levels.`,
        recommendations: [
          'Continue current coping strategies',
          'Increase physical activity',
          'Practice mindfulness meditation'
        ],
        riskAssessment: ['low', 'moderate', 'high'][i % 3],
        flaggedForFollowUp: i % 4 === 0,
        followUpNotes: i % 4 === 0 ? 'Schedule follow-up in 2 weeks' : null,
        reviewedAt: i % 3 === 0 ? null : new Date(),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
      await review.save();
    }
    console.log('✓ Created 10 reviews');

    console.log('\n✅ Test data population completed successfully!\n');
    console.log('📋 Summary:');
    console.log('   - Reviewer Account: reviewer@mstress.com / reviewer123');
    console.log('   - Admin Account: admin@mstress.com / admin123');
    console.log('   - Regular Users: 15 users created');
    console.log('   - Assessments: 15 assessments created');
    console.log('   - Reviews: 10 reviews created\n');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error populating test data:', error);
    process.exit(1);
  }
}

async function createOrUpdateUser(userData) {
  try {
    let user = await User.findOne({ email: userData.email });
    
    if (user) {
      console.log(`  - User ${userData.email} already exists, skipping...`);
      return user;
    }

    user = new User({
      email: userData.email,
      password: userData.password,
      name: userData.name,
      role: userData.role,
      isActive: userData.isActive !== false,
      isEmailVerified: true,
      authProvider: 'local'
    });

    await user.save();
    return user;
  } catch (error) {
    console.error(`Error creating user ${userData.email}:`, error);
    throw error;
  }
}

