const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');

AWS.config.loadFromPath(__dirname + '/../../config/awsconfig.json');
const s3 = new AWS.S3();

const upload = (dir) => multer({
    storage: multerS3({
        s3: s3,
        bucket: "proground" + dir,
        key: function(req, file, cb) {
            cb(null, Date.now().toString() + "_" + file.originalname);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: "public-read-write"
    })
});

/*
const erase = (dir, image) => s3.deleteObject({
    Bucket: "proground" + dir,
    Key: image
}, (err, data) => {
    if (err) {
        logger.error(`S3 image delete error\n: ${JSON.stringify(err)}`);
    }
});
*/

module.exports = {
    upload
};
