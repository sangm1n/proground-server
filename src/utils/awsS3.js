const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

AWS.config.loadFromPath(__dirname + '/../../config/awsconfig.json');

const upload = (dir) => multer({
    storage: multerS3({
        s3: s3,
        bucket: "proground" + dir,
        acl: "public-read",
        key: function(req, file, cb) {
            cb(null, Date.now().toString() + "_" + file.originalname);
        }
    })
});

module.exports = upload;
