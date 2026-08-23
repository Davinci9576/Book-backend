import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { users } from "../db/mongodb";

export const login = async (req: Request, res: Response) => {
  try {
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
        errror: "Invalid password",
      });
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
  } catch (error) {
    console.error("Login failed", error);
    res.status(500).json({
      error: "Login failed",
    });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password || !fullName) {
      res.status(400).json({
        error: "Email, password, and full name are required",
      });
      return;
    }
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      res.status(401).json({
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
  } catch (error) {
    console.error("Registration failed:", error);
    res.status(500).json({
      error: "Registration failed!",
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email && !password) {
      res.status(400).json({
        error: "Email or password is required",
      });
      return;
    }
    const userId = new ObjectId(req.user!.userId);

    const updateData: {
      email?: string;
      password?: string;
    } = {};
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
  } catch (error) {
    console.error("Update user failed: ", error);
    res.status(500).json({
      error: "Failed to update user",
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = new ObjectId(req.user!.userId);
    const result = await users.deleteOne({
      _id: userId,
    });
    if (result.deletedCount === 0) {
      res.status(404).json({
        error: "User not found!",
      });
      return;
    }
    res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user failed: ", error);
    res.status(500).json({
      error: "Failed to delete user",
    });
  }
};

export const getMe = async (req: Request, res: Response)=>{
  try{
    const userId = new ObjectId(req.user!.userId);
    const user = await users.findOne(
      {_id: userId},
      {
        projection: {
          password: 0,
        },
      },
    );
    if(!user){
      res.status(404).json({
        error: "User not found!",
      });
      return;
    }
    res.json({
      user,
    });
  }catch(error){
    console.error("Get me failed", error);
    res.status(500).json({
      error: "Failed to get user",
    });
  }
};