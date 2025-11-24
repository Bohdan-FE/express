import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';

const s3 = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: 'AKIAUA3XRWTQX2VCRT7V',
    secretAccessKey: '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',
  },
});

export const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'user-avatars-narutodashboard',
    key: (req, file, cb) => {
      const ext = file.originalname.split('.').pop();
      cb(null, `avatars/${Date.now()}.${ext}`);
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
