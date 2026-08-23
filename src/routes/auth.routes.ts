import { Router } from "express";
import {
  login,
  register,
  updateUser,
  getMe,
  deleteUser,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.post("/login", login);
router.post("/register", register);

router.patch("/update", authenticate, updateUser);

router.get("/me", authenticate, getMe);

router.delete("/delete", authenticate, deleteUser);

export default router;
