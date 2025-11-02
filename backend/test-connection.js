const { MongoClient, ServerApiVersion } = require('mongodb');

// Using the exact connection string format you provided
const uri = "mongodb+srv://sameeksha1906:sameeksha1906@cluster0.6ac9pmv.mongodb.net/?appName=Cluster0";

// Create a new MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
});

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    
    // Test the connection
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
    
    // List all databases
    const adminDb = client.db('admin');
    const result = await adminDb.admin().listDatabases();
    console.log('\nAvailable databases:');
    result.databases.forEach(db => console.log(`- ${db.name}`));
    
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    if (error.code) console.error('Error code:', error.code);
    if (error.codeName) console.error('Error code name:', error.codeName);
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed');
  }
}

run().catch(console.error);
