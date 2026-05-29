import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";
import authRoutes from "./routes/auth.routes";
import expedienteRoutes from "./routes/expediente.routes";
import documentoRoutes from "./routes/documento.routes"
import configTramiteRoutes from './routes/configTramite.routes';
import aparienciaRoutes from './routes/apariencia.routes';
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());
// La carpeta 'uploads' ya no es pública. Se debe usar el endpoint /descargar

app.get("/", (_req: Request, res: Response) => {
  res.json({ ok: true, msg: "Saludos desde el backend de SIGTA" });
});

app.use("/api/auth", authRoutes);
app.use("/api/expedientes", expedienteRoutes);
app.use("/api/expedientes/:expedienteId/documentos", documentoRoutes);
app.use('/api/config-tramites', configTramiteRoutes);
app.use('/api/apariencia', aparienciaRoutes);

// Manejador global de errores
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error no manejado:", err);
  if (err.name === 'MongoServerError' && err.code === 11000) {
    res.status(400).json({ ok: false, msg: 'Error: Registro duplicado detectado' });
  } else {
    res.status(500).json({ ok: false, msg: err.message || 'Error interno del servidor' });
  }
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "";

async function start() {
  try {
    if (!MONGO_URI) throw new Error("Falta MONGO_URI en variables de entorno");
    await mongoose.connect(MONGO_URI);
    console.log("Mongo conectado");
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Backend en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Error al iniciar:", err);
    process.exit(1);
  }
}

start();
