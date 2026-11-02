const express = require('express');
const { handleUpload } = require('@vercel/blob/client');
const { authRequired, adminRequired } = require('../middleware/auth');
const dbGuard = require('../middleware/database');

const router = express.Router();
const allowedContentTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const maximumSizeInBytes = 10 * 1024 * 1024;

router.post('/', authRequired, dbGuard, adminRequired, async (req, res) => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(503).json({ message: 'Image uploads are not configured on the server.' });
  }

  try {
    const result = await handleUpload({
      body: req.body,
      request: req,
      token,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith('products/')) {
          throw Object.assign(new Error('Invalid product image path.'), { status: 400 });
        }

        return {
          allowedContentTypes,
          maximumSizeInBytes,
          addRandomSuffix: true,
        };
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Blob upload authorization error:', error);
    const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600
      ? error.status
      : 500;
    return res.status(status).json({
      message: status === 400 ? error.message : 'Unable to authorize the image upload.',
    });
  }
});

module.exports = router;
