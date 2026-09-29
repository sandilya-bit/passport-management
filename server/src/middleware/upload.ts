import multer from 'multer';
import { ApiError } from '../utils/api-error';

const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);

export const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) return callback(new ApiError(400, 'Only PDF, JPEG, and PNG documents are accepted.'));
    callback(null, true);
  },
}).single('file');