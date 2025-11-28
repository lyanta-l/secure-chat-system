const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { sessions } = require('./auth');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '';
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const allowedMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
]);

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  },
});

function authenticate(req, res, next) {
  const token = req.headers.authorization;
  const userId = sessions.get(token);

  if (!userId) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  req.userId = userId;
  return next();
}

router.post('/uploads', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '文件不能为空' });
  }

  const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'document';
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

  return res.json({
    success: true,
    file: {
      filename: req.file.filename,
      originalName,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: fileUrl,
      fileType,
      uploadedBy: req.userId,
    },
  });
});

router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: '文件大小不能超过10MB' });
    }

    return res.status(400).json({ success: false, message: err.message });
  }

  if (err) {
    return res.status(400).json({ success: false, message: err.message || '上传失败' });
  }

  return res.status(500).json({ success: false, message: '服务器错误' });
});

module.exports = router;
