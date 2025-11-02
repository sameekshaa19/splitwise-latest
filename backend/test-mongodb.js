const { MongoClient, ServerApiVersion } = require('mongodb');

// MongoDB Atlas connection string
const username = 'sameeksha1906';
const password = encodeURIComponent('sameeksha1906'); // URL encode the password
const cluster = 'cluster0.6ac9pmv.mongodb.net';
const dbName = 'Splitwise_pbl';

// Create the connection string
const uri = `mongodb+srv://${username}:${password}@${cluster}/${dbName}?retryWrites=true&w=majority`;

console.log('Connecting to MongoDB with URI:', 
  `mongodb+srv://${username}:*****@${cluster}/${dbName}?retryWrites=true&w=majority`
);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 10000, // 10 seconds connection timeout
  socketTimeoutMS: 45000, // 45 seconds socket timeout
});

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    // Connect the client to the server
    await client.connect();
    
    // List all databases
    const adminDb = client.db('admin');
    const result = await adminDb.admin().listDatabases();
    console.log('Available databases:');
    result.databases.forEach(db => console.log(`- ${db.name}`));
    
    // Send a ping to confirm a successful connection
    await adminDb.command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error('MongoDB connection error:', error);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
    console.log('MongoDB connection closed');
  }
}

run().catch(console.dir);
