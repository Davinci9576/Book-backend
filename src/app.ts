import express, { Router } from "express";
import type { Express, Request, Response } from "express";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticate } from "./middleware/authenticate";
import { supabase } from "./supabase";

const app: Express = express();
const port = Number(process.env.PORT) || 3000;
const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db("bookapp");
interface User {
  email: string;
  password: string;
  fullName: string;
}
interface Book {
  names: string;
  publication: number;
  pdf: string | null;
  author: string;
  uploaded_by: string;
  thumbnail: string;
}
const booksCollection = db.collection<Book>("books");
const users = db.collection<User>("users");
app.use(express.json());

app.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      error: "Email and password are required",
    });
    return;
  }

  const user = await users.findOne({ email });
  if (!user) {
    res.status(401).json({
      error: "Invalid email or password",
    });
    return;
  }
  const passwordCorrect = await bcrypt.compare(password, user.password);
  if (!passwordCorrect) {
    res.status(401).json({
      error: "Invalid email or password",
    });
    return;
  }
  const token = jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "1h",
    },
  );

  res.json({
    message: "Login successful",
    token,
  });
});

app.post("/auth/register", async (req: Request, res: Response) => {
  //auth router to another file
  const { email, password, fullName } = req.body;
  if (!email || !password || !fullName) {
    res.status(400).json({
      error: "Email and password are required",
    });
    return;
  }

  const existingUser = await users.findOne({ email });
  if (existingUser) {
    res.status(409).json({
      error: "User already exists",
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await users.insertOne({
    email,
    password: hashedPassword,
    fullName,
  });

  res.status(201).json({
    message: "User registered successfully",
    userId: result.insertedId,
  });
});

app.patch("/auth/update", authenticate, async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email && !password) {
    res.status(400).json({
      error: "Email or password is required.",
    });
    return;
  }

  const userId = new ObjectId(req.user!.userId);
  const updateData: Partial<User> = {};

  if (email) {
    const existingUser = await users.findOne({
      email,
      _id: { $ne: userId },
    });

    if (existingUser) {
      res.status(409).json({
        error: "Email already exists",
      });
      return;
    }

    updateData.email = email;
  }
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  const result = await users.updateOne({ _id: userId }, { $set: updateData });
  if (result.matchedCount === 0) {
    res.status(404).json({
      error: "User not found",
    });
    return;
  }

  res.json({
    message: "User updated successfully",
  });
});

app.get("/Books", authenticate, async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 0;
    const skip = page * 10;
    const limit = 10;
    const books = await booksCollection
      .find()
      .skip(skip)
      .limit(limit)
      .toArray();
    res.json(books);
  } catch (error) {
    console.error("Failed to get books", error);
    res.status(500).json({
      error: "Failed to get the books",
    });
  }
});
app.post("/Books", authenticate, async (req: Request, res: Response) => {
  try {
    const { names, publication, pdf, author, thumbnail } = req.body;
    if (!names || !publication || !author) {
      res.status(400).json({
        error: "Name, publication, and author are required",
      });
      return;
    }
    const book = {
      names,
      publication: Number(publication),
      pdf: pdf ?? null,
      author,
      thumbnail: thumbnail ?? null,
      uploaded_by: req.user!.userId,
    };
    const result = await booksCollection.insertOne(book);
    res.status(201).json({
      message: "Book created successfully",
      book: {
        _id: result.insertedId,
        ...book,
      },
    });
  } catch (error) {
    console.error("Failed to create book", error);
    res.status(500).json({
      error: "Failed to create book",
    });
  }
});

app.get("/auth/me", authenticate, (req: Request, res: Response) => {
  res.json({
    user: req.user,
  });
});
app.delete(
  "/auth/delete",
  authenticate,
  async (req: Request, res: Response) => {
    const userId = new ObjectId(req.user!.userId);
    const result = await users.deleteOne({
      _id: userId,
    });
    if (result.deletedCount === 0) {
      res.status(404).json({
        error: "User not found",
      });
      return;
    }
    res.json({
      message: "User deleted successfully",
    });
  },
);
app.patch(
  "/Books/:id",
  authenticate,
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const bookId = new ObjectId(req.params.id);
      const { names, publication, pdf, author, thumbnail } = req.body;
      const book = await booksCollection.findOne({
        _id: bookId,
      });
      if (!book) {
        res.status(404).json({
          error: "Book not found",
        });
        return;
      }
      if (book.uploaded_by !== req.user!.userId) {
        res.status(403).json({
          error: "You are not allowed to update this book",
        });
        return;
      }
      const updateData: Partial<Book> = {};
      if (names) {
        updateData.names = names;
      }
      if (publication) {
        updateData.publication = Number(publication);
      }
      if (pdf !== undefined) {
        updateData.pdf = pdf;
      }
      if (author) {
        updateData.author = author;
      }
      if (thumbnail !== undefined) {
        updateData.thumbnail = thumbnail;
      }
      const result = await booksCollection.updateOne(
        { _id: bookId },
        { $set: updateData },
      );
      if (result.matchedCount === 0) {
        res.status(404).json({
          error: "Book not found!",
        });
        return;
      }
      const updateBook = await booksCollection.findOne({
        _id: bookId,
      });
      res.json({
        message: "Book updated successfully",
        book: updateBook,
      });
    } catch (error) {
      console.error("Failed to update book: ", error);
      res.status(500).json({
        error: "Failed to update book",
      });
    }
  },
);
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
