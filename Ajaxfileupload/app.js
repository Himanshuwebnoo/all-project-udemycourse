var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var path = require('path');
var fileUpload = require('express-fileupload');
var helmet = require('helmet');

var app = express();

app.set('view engine', 'ejs');

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://stackpath.bootstrapcdn.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    },
  })
);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true, limit: '150kb', parameterLimit: 50000 }));

app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use('/images', express.static(__dirname + '/images')); // Serve static files from /images directory

app.use(
  fileUpload({
   limits: { fileSize: 200 * 1024 }, // Set the file size limit to 5KB (5 * 1024 bytes)
  })
);

app.get('/', (req, res) => {
  res.render('demo', { nonce: res.locals.nonce });
});

app.post('/upload', (req, res) => {
  if (!req.files || !req.files.file) {
    res.status(400).json({ msg: 'No file uploaded' });
    return;
  }

  var uploadedFile = req.files.file;

  if (uploadedFile.size > 200 * 1024) {
   res.status(400).json({ msg: 'File size exceeds the limit of 200KB' });
   return;
 }

  var filename = uploadedFile.name;
  var filePath = path.join(__dirname, 'images', filename);

  uploadedFile.mv(filePath, function (err) {
    if (err) {
      console.error(err);
      res.status(500).json({ msg: 'Error uploading file' });
      return;
    }

    var temp = fs.readFileSync(filePath);
    var base64data = temp.toString('base64');
    res.json({ msg: 'success', data: base64data, filename: filename });
  });
});

var port = process.env.PORT || 3001;
app.listen(port, () => console.log('Server is running on port ' + port));
