import { MongoClient, Db } from 'mongodb';
import clientPromise from '../mongodb';

/**
 * Creates a new database for a user and initializes required collections
 * @param userId - The unique identifier for the user (MongoDB ObjectId)
 */
export async function createUserDatabase(userId: string): Promise<void> {
  const client = await clientPromise;
  
  try {
    // Get the user-specific database
    const dbName = `user_${userId}`;
    const db = client.db(dbName);
    
    // Define collections to create with their indexes
    const collections: Array<{
      name: string;
      indexes: Array<{
        key: Record<string, 1 | -1 | 'text'>;
        unique?: boolean;
      }>;
    }> = [
      {
        name: 'vectors',
        indexes: [
          { key: { contentType: 1 } },
          { key: { createdAt: -1 } },
          { key: { 'metadata.reference': 1 } },
          { key: { 'metadata.sessionId': 1 } },
          { key: { 'metadata.topics': 1 } }
        ]
      },
      {
        name: 'reading_plans',
        indexes: [
          { key: { createdAt: -1 } },
          { key: { isPublic: 1 } },
          { key: { name: 1 } }
        ]
      },
      {
        name: 'quiz_results',
        indexes: [
          { key: { planId: 1 } },
          { key: { completedAt: -1 } },
          { key: { score: -1 } }
        ]
      },
      {
        name: 'bible_notes',
        indexes: [
          { key: { reference: 1 } },
          { key: { createdAt: -1 } },
          { key: { tags: 1 } }
        ]
      },
      {
        name: 'chat_sessions',
        indexes: [
          { key: { createdAt: -1 } },
          { key: { updatedAt: -1 } },
          { key: { bookId: 1 } },
          { key: { tags: 1 } },
          { key: { '$**': 'text' } } // Text index for search
        ]
      },
      {
        name: 'chat_messages',
        indexes: [
          { key: { sessionId: 1, createdAt: 1 } },
          { key: { role: 1 } },
          { key: { 'metadata.action': 1 } }
        ]
      },
      {
        name: 'highlights',
        indexes: [
          { key: { reference: 1 } },
          { key: { type: 1 } },
          { key: { createdAt: -1 } },
          { key: { tags: 1 } },
          { key: { 'aiContext.sessionId': 1 } }
        ]
      }
    ];
    
    // Create collections and their indexes
    for (const collectionConfig of collections) {
      try {
        // Create collection
        await db.createCollection(collectionConfig.name);
        console.log(`Created collection: ${collectionConfig.name} in database: ${dbName}`);
        
        // Create indexes
        const collection = db.collection(collectionConfig.name);
        for (const index of collectionConfig.indexes) {
          await collection.createIndex(index.key, { 
            unique: index.unique || false,
            background: true 
          });
        }
        console.log(`Created indexes for collection: ${collectionConfig.name}`);
      } catch (error: any) {
        // Collection might already exist, which is fine
        if (error.codeName !== 'NamespaceExists') {
          throw error;
        }
        console.log(`Collection ${collectionConfig.name} already exists in database: ${dbName}`);
      }
    }
    
    console.log(`Successfully initialized database for user: ${userId}`);
  } catch (error) {
    console.error(`Error creating user database for ${userId}:`, error);
    throw error;
  }
}

/**
 * Gets a user's database
 * @param userId - The unique identifier for the user
 * @returns The user's database instance
 */
export async function getUserDatabase(userId: string): Promise<Db> {
  const client = await clientPromise;
  const dbName = `user_${userId}`;
  return client.db(dbName);
}

/**
 * Checks if a user database exists
 * @param userId - The unique identifier for the user
 * @returns true if the database exists, false otherwise
 */
export async function userDatabaseExists(userId: string): Promise<boolean> {
  const client = await clientPromise;
  
  try {
    const dbName = `user_${userId}`;
    const admin = client.db().admin();
    const databases = await admin.listDatabases();
    
    return databases.databases.some((db: any) => db.name === dbName);
  } catch (error) {
    console.error(`Error checking if user database exists for ${userId}:`, error);
    return false;
  }
}

/**
 * Deletes a user database (use with caution!)
 * @param userId - The unique identifier for the user
 */
export async function deleteUserDatabase(userId: string): Promise<void> {
  const client = await clientPromise;
  
  try {
    const dbName = `user_${userId}`;
    const db = client.db(dbName);
    
    await db.dropDatabase();
    console.log(`Deleted database for user: ${userId}`);
  } catch (error) {
    console.error(`Error deleting user database for ${userId}:`, error);
    throw error;
  }
}
