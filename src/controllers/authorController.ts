import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { authors } from "../db/mongodb";

export const createAuthor = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({
        error: "Author name is required",
      });
      return;
    }

    const existingAuthor = await authors.findOne({
      name: name.trim(),
    });

    if (existingAuthor) {
      res.status(200).json({
        id: existingAuthor._id.toString(),
        name: existingAuthor.name,
      });
      return;
    }

    const result = await authors.insertOne({
      name: name.trim(),
    });

    res.status(201).json({
      id: result.insertedId.toString(),
      name: name.trim(),
    });
  } catch (error) {
    console.error("Create author failed:", error);

    res.status(500).json({
      error: "Failed to create author",
    });
  }
};

export const getAuthorById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    if (!ObjectId.isValid(id)) {
      res.status(400).json({
        error: "Invalid author ID",
      });
      return;
    }

    const author = await authors.findOne({
      _id: new ObjectId(id),
    });

    if (!author) {
      res.status(404).json({
        error: "Author not found",
      });
      return;
    }

    res.status(200).json({
      id: author._id.toString(),
      name: author.name,
    });
  } catch (error) {
    console.error("Get author failed:", error);

    res.status(500).json({
      error: "Failed to get author",
    });
  }
};