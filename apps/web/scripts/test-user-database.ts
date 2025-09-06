import { MongoClient } from 'mongodb';
import clientPromise from '../lib/mongodb';
import { getUserDatabase } from '../lib/utils/user-db';

async function testUserDatabase() {
  try {
    const client = await clientPromise;
    
    // Get the main database
    const mainDb = client.db('mustard');
    const usersCollection = mainDb.collection('users');
    
    // Find a test user
    const testUser = await usersCollection.findOne({});
    if (!testUser) {
      console.log('No users found in database');
      return;
    }
    
    console.log('Testing with user:', {
      id: testUser._id,
      email: testUser.email,
      firebaseUid: testUser.firebaseUid
    });
    
    // Get user's database
    const userDb = await getUserDatabase(testUser._id.toString());
    
    // List all collections in user's database
    const collections = await userDb.listCollections().toArray();
    console.log('\nUser database collections:');
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });
    
    // Check specific collections
    const expectedCollections = [
      'vectors',
      'reading_plans',
      'quiz_results',
      'bible_notes',
      'chat_sessions',
      'chat_messages',
      'highlights'
    ];
    
    console.log('\nChecking expected collections:');
    for (const colName of expectedCollections) {
      const exists = collections.some(col => col.name === colName);
      console.log(`- ${colName}: ${exists ? '✓' : '✗'}`);
    }
    
    // Check chat sessions
    const chatSessions = await userDb.collection('chat_sessions').countDocuments();
    console.log(`\nChat sessions count: ${chatSessions}`);
    
    // Check highlights
    const highlights = await userDb.collection('highlights').countDocuments();
    console.log(`Highlights count: ${highlights}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing user database:', error);
    process.exit(1);
  }
}

testUserDatabase();
