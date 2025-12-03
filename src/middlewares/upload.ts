import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import multer from 'multer';
import multerS3 from 'multer-s3';

dotenv.config();

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  throw new Error('AWS credentials are not set in environment variables');
}

const s3 = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadAvatar = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'user-avatars-narutodashboard',
    key: (req, file, cb) => {
      const ext = file.originalname.split('.').pop();
      cb(null, `avatars/${Date.now()}.${ext}`);
    },
  }),
});

export const uploadMessageImage = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'user-avatars-narutodashboard',
    key: (req, file, cb) => {
      const ext = file.originalname.split('.').pop();
      cb(null, `messages/${Date.now()}.${ext}`);
    },
  }),
});

export const deleteFromS3 = async (url: string) => {
  if (!url) return;

  const key = url.split('.com/')[1];

  if (!key) return;

  const command = new DeleteObjectCommand({
    Bucket: 'user-avatars-narutodashboard',
    Key: key,
  });

  await s3.send(command);
};
