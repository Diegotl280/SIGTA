import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    // Limpiar el nombre del archivo para evitar path traversal y caracteres extraños
    const extension = path.extname(file.originalname).toLowerCase();
    const nombreLimpio = path.basename(file.originalname, extension).replace(/[^a-zA-Z0-9_-]/g, '_');
    const nombre = `${timestamp}-${nombreLimpio}${extension}`;
    cb(null, nombre);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (file.mimetype === 'application/pdf' && extension === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos con extensión .pdf válidos'));
  }
};

const imageFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes PNG, JPG, JPEG o WEBP válidas'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB máximo por archivo
  },
});

export const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
