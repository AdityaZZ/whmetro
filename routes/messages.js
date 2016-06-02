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

// 公告
router.get('/announcement', function(req, res, next) {
  res.render('message/announcement');
});

// 日报
router.get('/report/daily', function(req, res, next) {
  res.render('message/report-daily');
});

// 周报
router.get('/report/weekly', function(req, res, next) {
  res.render('message/report-weekly');
});

// 整改
router.get('/rectificate', function(req, res, next) {
  res.render('message/rectificate');
});

module.exports = router;
