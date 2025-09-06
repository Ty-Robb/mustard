import { getDatabase } from '../lib/mongodb';

async function checkMongoDBUsage() {
  console.log('Checking MongoDB storage usage...\n');
  
  try {
    const db = await getDatabase();
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections:\n`);
    
    let totalSize = 0;
    let totalDocuments = 0;
    
    // Check each collection
    for (const collectionInfo of collections) {
      const collection = db.collection(collectionInfo.name);
      
      // Use db.command with collStats instead of collection.stats()
      const stats = await db.command({ collStats: collectionInfo.name });
      
      const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
      const storageInMB = (stats.storageSize / 1024 / 1024).toFixed(2);
      
      console.log(`Collection: ${collectionInfo.name}`);
      console.log(`  Documents: ${stats.count}`);
      console.log(`  Data Size: ${sizeInMB} MB`);
      console.log(`  Storage Size: ${storageInMB} MB`);
      console.log(`  Indexes: ${stats.nindexes}`);
      console.log('');
      
      totalSize += stats.storageSize;
      totalDocuments += stats.count;
    }
    
    console.log('-------------------');
    console.log(`Total Storage Used: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total Documents: ${totalDocuments}`);
    
    // Get database stats
    const dbStats = await db.stats();
    console.log(`\nDatabase Stats:`);
    console.log(`  Data Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Storage Size: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Index Size: ${(dbStats.indexSize / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('Error checking MongoDB usage:', error);
  }
  
  process.exit(0);
}

checkMongoDBUsage();
