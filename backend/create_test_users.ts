import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "./src/models/User";
import "dotenv/config";

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://Administrador:Sigta_20.26@sigta.2h5qj1k.mongodb.net/?appName=SIGTA";

async function createTestUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Conectado a Mongo para crear usuarios de prueba");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("123456", salt);

    const adminExists = await User.findOne({ email: "admin@sigta.com" });
    if (!adminExists) {
      await User.create({
        email: "admin@sigta.com",
        password: hashedPassword,
        role: "administrador"
      });
      console.log("Admin creado: admin@sigta.com / 123456");
    }

    const userExists = await User.findOne({ email: "usuario@sigta.com" });
    if (!userExists) {
      await User.create({
        email: "usuario@sigta.com",
        password: hashedPassword,
        role: "usuario"
      });
      console.log("Usuario creado: usuario@sigta.com / 123456");
    }

    console.log("Usuarios de prueba listos.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createTestUsers();
