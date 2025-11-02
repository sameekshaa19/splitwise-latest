import clientPromise from '../config/database';

// Example of a generic database operation
const withDB = async (collectionName: string, operation: (collection: any) => Promise<any>) => {
  try {
    const client = await clientPromise;
    const db = client.db(); // Use your database name if different from default
    const collection = db.collection(collectionName);
    return await operation(collection);
  } catch (error) {
    console.error('MongoDB operation failed:', error);
    throw error;
  }
};

// Example CRUD operations
export const db = {
  // Create
  insertOne: async (collectionName: string, document: any) => {
    return withDB(collectionName, async (collection) => {
      return await collection.insertOne(document);
    });
  },
  
  // Read
  find: async (collectionName: string, query: any = {}, options: any = {}) => {
    return withDB(collectionName, async (collection) => {
      return await collection.find(query, options).toArray();
    });
  },
  
  findOne: async (collectionName: string, query: any, options: any = {}) => {
    return withDB(collectionName, async (collection) => {
      return await collection.findOne(query, options);
    });
  },
  
  // Update
  updateOne: async (collectionName: string, filter: any, update: any, options: any = {}) => {
    return withDB(collectionName, async (collection) => {
      return await collection.updateOne(filter, { $set: update }, options);
    });
  },
  
  // Delete
  deleteOne: async (collectionName: string, filter: any) => {
    return withDB(collectionName, async (collection) => {
      return await collection.deleteOne(filter);
    });
  }
};

export default db;
