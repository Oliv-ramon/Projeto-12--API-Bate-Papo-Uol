import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

async function mongoConnection() {
  const mongoClient = new MongoClient(process.env.MONGO_URI);

  await mongoClient.connect();
  
  return mongoClient;
}

export default mongoConnection;