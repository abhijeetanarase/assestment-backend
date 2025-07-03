import { log } from 'console';
import multer from 'multer';

// Store file in memory (buffer)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  
  fileFilter: (req, file, cb) => {
  const allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
        console.log('File type is valid:', file.mimetype);
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

export default upload;
