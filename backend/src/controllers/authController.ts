import { Request, Response } from "express";
import { registerUser, loginUser } from "../services/authService";

export async function register(req: Request, res: Response) {
  try {
    const user = await registerUser(req.body);
    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    return res.json(result);
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}
