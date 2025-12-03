// src/middleware/upload.ts
import multer from 'multer';

const storage = multer.memoryStorage();
export const uploadMiddleware = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // limit 50MB (adjust)
