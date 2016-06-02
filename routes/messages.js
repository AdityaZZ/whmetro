var express = require('express');
var router = express.Router();

// 基路径
router.base = '/message';

router.get('/', function(req, res, next) {
  res.redirect('/message/risk');
});

// 风险
router.get('/risk', function(req, res, next) {
  res.render('message/risk');
});

// 回复
router.get('/reply', function(req, res, next) {
  res.render('message/reply');
});

module.exports = router;
