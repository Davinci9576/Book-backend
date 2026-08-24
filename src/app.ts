import express from "express";
import "dotenv/config";
import { MongoClient } from "mongodb";

import authRouter from "./routes/auth.routes";
import { router as bookRouter } from "./routes/book.routes";
const app = express();

const port = Number(process.env.PORT) || 3000;

const client = new MongoClient(process.env.MONGODB_URI!);

app.use(express.json());

app.use("/auth", authRouter);
app.use("/books", bookRouter);

async function startServer() {
  try {
    await client.connect();

    console.log("Connected to MongoDB");

    app.listen(port, "0.0.0.0", () => {
      console.log(`Example app listening on port ${port}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
  }
}

startServer();