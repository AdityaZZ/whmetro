var express = require('express');
var crypto = require('crypto');
var Mock = require('mockjs');
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


// =============================================================================
// FAKE DATA MOCK
// =============================================================================
var comment_storage = {};
router.get('/comments', function(req, res, next) {
  var msgid = req.query.msgid;
  var page = req.query.page | 0;
  var size = 15;
  var comments = comment_storage[msgid];
  var total;
  var data = [];
  if(!comments) {
    comments = comment_storage[msgid] = [];
    total = Mock.Random.natural(1, 150);
    for(var i = 0; i < total; ++i) {
      var id = Mock.Random.increment();
      var hash = checksum(`whmetro-${id}`);
      comments.push({
        id: Mock.Random.increment(),
        time: Mock.Random.datetime(),
        timestamp: ((new Date()).getTime() / 1000) | 0,
        author: Mock.Random.cname(),
        avatar_url: `/avatar/${hash}?size=50`,
        reply_to: {
          name: Mock.Random.cname(),
          profile_url: '#'
        },
        message: Mock.Random.cparagraph(1, 4)
      });
    }
  }
  if(page < 0) {
    page = -page;
  }
  total = comments.length;

  res.send({
    total: Math.ceil(total / size),
    page: page,
    data: comments.slice((page - 1) * size, page * size)
  });
});


// =============================================================================
// COMMON FUNCTIONS
// =============================================================================
function checksum(str, algorithm, encoding) {
  return crypto
    .createHash(algorithm || 'md5')
    .update(str, 'utf8')
    .digest(encoding || 'hex');
}

module.exports = router;
