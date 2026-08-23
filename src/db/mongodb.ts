import { MongoClient } from "mongodb";
import "dotenv/config";

const client = new MongoClient(process.env.MONGODB_URI!);

const db = client.db("bookapp");

export const users = db.collection("users");
export const books = db.collection("books");

export async function connectMongoDB() {
  await client.connect();
  console.log("Connected to MongoDB");
}
