import type { Request, Response } from "express";
import { books } from "../db/mongodb";
import {ObjectId} from "mongodb";

export const createBook = async (req: Request, res: Response) => {
  try {
    const { name, publication, pdf, author, thumbnail } = req.body;
    if (!name || !publication || !pdf || !author || !thumbnail) {
      res.status(400).json({
        error: "All book fields are required",
      });
      return;
    }
    const uploadedBy = req.user!.userId;

    const result = await books.insertOne({
      names: name,
      publication: Number(publication),
      pdfUrl: pdf,
      author,
      uploadedBy,
      thumbnail,
    });
    res.status(201).json({
      message: "Book created successfully",
      bookId: result.insertedId,
    });
  } catch (error) {
    console.error("Create book failed:", error);
    res.status(500).json({
      error: "Failed to create book",
    });
  }
};
export const getBooks = async (req: Request, res: Response)=>{
  try{
    const bookList = await books.find().toArray();
    const formattedBooks = bookList.map((book) => ({
      id: book._id.toString(),
      name: book.names,
      publication: book.publication,
      pdf: book.pdfUrl,
      author: book.author,
      uploaded_by: book.uploadedBy,
      thumbnail: book.thumbnail,
    }));

    res.status(200).json(formattedBooks);
  }catch(error){
    console.error("Get books failed:", error);
    res.status(500).json({
      error: "Failed to get books",
    });
  }
};
export const getMyBooks = async (req: Request, res: Response) => {
  try {
    const uploadedBy = req.user!.userId;

    const bookList = await books
      .find({ uploadedBy })
      .toArray();
        const formattedBooks = bookList.map((book) => ({
      id: book._id.toString(),
      name: book.names,
      publication: book.publication,
      pdf: book.pdfUrl,
      author: book.author,
      uploaded_by: book.uploadedBy,
      thumbnail: book.thumbnail,
    }));


    res.status(200).json(formattedBooks);
  } catch (error) {
    console.error("Get my books failed:", error);

    res.status(500).json({
      error: "Failed to get your books",
    });
  }
};
export const getBookById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    console.log("BOOK ID FROM URL:", id);
    console.log("VALID OBJECT ID:", ObjectId.isValid(id));

    if (!ObjectId.isValid(id)) {
      res.status(400).json({
        error: "Invalid book ID",
      });
      return;
    }

    const objectId = new ObjectId(id);

    const book = await books.findOne({
      _id: objectId,
    });

    console.log("BOOK FOUND:", book);

    if (!book) {
      res.status(404).json({
        error: "Book not found!",
      });
      return;
    }

    const formattedBook = {
      id: book._id.toString(),
      name: book.names,
      publication: book.publication,
      pdf: book.pdfUrl,
      author: book.author,
      uploaded_by: book.uploadedBy,
      thumbnail: book.thumbnail,
    };

    res.status(200).json(formattedBook);
  } catch (error) {
    console.error("Get book failed:", error);

    res.status(500).json({
      error: "Failed to get book",
    });
  }
};

export const updateBook = async (req: Request, res: Response)=>{
  try{
    const id = req.params.id as string;
    if(!ObjectId.isValid(id)){
      res.status(400).json({
        error: "Invalid book ID",
      });
      return;
    }
    const {name, publication, pdf, author, thumbnail}= req.body;
    const book = await books.findOne({
      _id: new ObjectId(id),
    });
    if(!book){
      res.status(404).json({
        error: "Book not found",
      });
      return;
    }
    if(book.uploadedBy!== req.user!.userId){
      res.status(403).json({
        error: "You can only update your own books",
      });
      return;
    }
    const result = await books.updateOne(
      {_id: new ObjectId(id)},
      {
        $set: {
          names: name,
          publication: Number(publication),
          pdfUrl: pdf,
          author,
          thumbnail,
        },
      }
    );
    res.status(200).json({
      message: "Book updated successfully",
    });
  }catch(error){
    console.error("Update book failed:", error);
    res.status(500).json({
      error: "Failed to update book",
    });
  }
};

export const deleteBook = async (req: Request, res: Response)=>{
  try{
    const id = req.params.id as string;
    if(!ObjectId.isValid(id)){
      res.status(400).json({
        error: "Invalid book ID",
      });
      return;
    }
    const book =await books.findOne(
      {_id: new ObjectId(id)},
    );
    if(!book){
      res.status(404).json({
        error: "Book not found!",
      });
      return;
    }
    if(book.uploadedBy!== req.user!.userId){
      res.status(403).json({
        error: "You can only delete your own book",
      });
      return;
    }
    await books.deleteOne({
      _id: new ObjectId(id),
    });
    res.status(200).json({
      message: "Book deleted successfully!",
    });
  }catch(error){
    console.error("Delete book failed!", error);
    res.status(500).json({
      error: "Failed to delete the book!",
    });
  }
};
