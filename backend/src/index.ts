import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";
import authRoutes from "./routes/auth.routes";

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "";

async function start() {
  try {
    if (!MONGO_URI) throw new Error("Falta MONGO_URI en variables de entorno");
    await mongoose.connect(MONGO_URI);
    console.log("Mongo conectado");

    app.get("/", (_req: Request, res: Response) => {
      res.json({ ok: true, msg: "Saludos desde el backend de SIGTA" });
    });

    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Backend en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Error al iniciar:", err);
    process.exit(1);
  }
}

start();