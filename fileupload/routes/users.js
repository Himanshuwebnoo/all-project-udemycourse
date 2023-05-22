const express = require('express');
const multer = require('multer');
const sharp = require('sharp');

const db = require('../data/database');
const storageConfig = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'images');
  },
  filename: function (req, file, cb) {
     cb(null, Date.now() + '-' + file.originalname);
  }
})
const upload = multer({ storage: storageConfig });
const router = express.Router();

router.get('/', async function(req, res) {
  const users = await db.getDb().collection('users').find().toArray();
  res.render('profiles', { users: users});
});

router.get('/new-user', function(req, res) {
  res.render('new-user');
});

router.post ('/profiles', upload.single('image'), async function(req, res) {
  const uploadedImageFile = req.file;
  const userData = req.body;

  // Perform backend validation
  if (!uploadedImageFile) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  // Check if username is provided
  if (!userData.username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  try {
    const image = sharp(uploadedImageFile.path);
    const metadata = await image.metadata();

    if (metadata.width > 200) {
      return res.status(400).json({ error: 'Image width should not exceed 200 pixels' });
    }
    const resizedImageBuffer = await image.resize({ width: 200 }).toBuffer();
    const resizedImagePath = `images/resized-${uploadedImageFile.filename}`;
    await sharp(resizedImageBuffer).toFile(resizedImagePath);
    
  await db.getDb().collection('users').insertOne({
    name: userData.username,
    ImagePath: uploadedImageFile.path
  });

  res.redirect('/');
}  catch (error) {
  console.error('Error inserting user:', error);
  res.status(500).json({ error: 'Server error' });
}
});
module.exports = router;