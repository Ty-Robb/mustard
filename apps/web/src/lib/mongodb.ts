import { MongoClient, Db, Collection, Document } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

// Database name
const DATABASE_NAME = 'mustard';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  READING_PLANS: 'reading_plans',
  BIBLE_CONTENT: 'bible_content',
  QUIZ_RESULTS: 'quiz_results',
  GROUPS: 'groups',
  // Future collections for vector search
  STRONGS_VECTORS: 'strongs_vectors',
  BIBLE_VERSE_VECTORS: 'bible_verse_vectors',
} as const;

// Helper function to get database
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db(DATABASE_NAME);
}

// Helper function to get a specific collection
export async function getCollection<T extends Document = Document>(
  collectionName: string
): Promise<Collection<T>> {
  const db = await getDatabase();
  return db.collection<T>(collectionName);
}

// Type-safe collection getters
export async function getUsersCollection() {
  return getCollection(COLLECTIONS.USERS);
}

export async function getReadingPlansCollection() {
  return getCollection(COLLECTIONS.READING_PLANS);
}

export async function getBibleContentCollection() {
  return getCollection(COLLECTIONS.BIBLE_CONTENT);
}

export async function getQuizResultsCollection() {
  return getCollection(COLLECTIONS.QUIZ_RESULTS);
}

export async function getGroupsCollection() {
  return getCollection(COLLECTIONS.GROUPS);
}

// Test connection function
export async function testConnection(): Promise<boolean> {
  try {
    const client = await clientPromise;
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log('✅ Successfully connected to MongoDB!');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    return false;
  }
}

// Initialize indexes (call this once during app startup)
export async function initializeIndexes(): Promise<void> {
  try {
    const db = await getDatabase();
    
    // Users collection indexes
    const users = db.collection(COLLECTIONS.USERS);
    await users.createIndex({ firebaseUid: 1 }, { unique: true });
    await users.createIndex({ email: 1 }, { unique: true });
    
    // Reading plans indexes
    const plans = db.collection(COLLECTIONS.READING_PLANS);
    await plans.createIndex({ userId: 1 });
    await plans.createIndex({ groupId: 1 });
    await plans.createIndex({ createdAt: -1 });
    
    // Bible content indexes
    const bibleContent = db.collection(COLLECTIONS.BIBLE_CONTENT);
    await bibleContent.createIndex({ translationId: 1, bookId: 1, chapterId: 1, verseId: 1 }, { unique: true });
    
    // Quiz results indexes
    const quizResults = db.collection(COLLECTIONS.QUIZ_RESULTS);
    await quizResults.createIndex({ userId: 1 });
    await quizResults.createIndex({ planId: 1 });
    await quizResults.createIndex({ completedAt: -1 });
    
    // Groups indexes
    const groups = db.collection(COLLECTIONS.GROUPS);
    await groups.createIndex({ memberIds: 1 });
    await groups.createIndex({ createdAt: -1 });
    
    console.log('✅ Database indexes initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize indexes:', error);
    throw error;
  }
}
