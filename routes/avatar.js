var jdenticon = require('jdenticon');
var express = require('express');
var router = express.Router();

router.base = '/';

router.get('/avatar/:hash', function(req, res, next) {
  var hash = req.params.hash;
  var size = req.query.size || 50;
  res.type('svg');
  res.send(jdenticon.toSvg(hash, size));
});

module.exports = router;
