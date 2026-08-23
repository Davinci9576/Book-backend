import {Router} from "express";
import {
    createBook,
    getBooks,
    getBookById,
    updateBook,
    deleteBook,
} from "../controllers/book.controller";
import {authenticate} from "../middleware/authenticate";


export const router = Router();
router.post("/", authenticate, createBook);
router.get("/", authenticate, getBooks);
router.get("/:id", authenticate, getBookById );
router.patch("/:id", authenticate, updateBook);
router.delete("/:id", authenticate, deleteBook);

