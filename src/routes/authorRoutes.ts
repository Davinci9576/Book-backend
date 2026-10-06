import {Router} from "express";
import {createAuthor, getAuthorById} from "../controllers/authorController";

const router = Router();

router.post("/", createAuthor);
router.get("/:id", getAuthorById);

export default router;