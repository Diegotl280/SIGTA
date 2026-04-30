import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, '../../uploads'); // REVISAR TODO LO DE LAS RUTAS RELATIVAS Y MEJOR USAR RUTAS GLOBALES. EN EL ARCHIVO DE CONFIGURACION VER BIEN QUE ONDA PARA EL DESPLIEGUE
console.log('uploadsDir:', uploadsDir); 
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const nombre = `${timestamp}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, nombre);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB máximo por archivo
  },
});