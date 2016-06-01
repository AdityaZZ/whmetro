var fs = require('fs');
var url = require('url');
var path = require('path');
var express = require('express');
var morgan = require('morgan');
var swig = require('swig');
var bodyParser = require('body-parser');

var app = express();

// Hack `app.render` so that we can get the view name in the view engine.
app._render = app.render;
app.render = function(name, options, callback) {
  var done = callback;
  var opts = options;
  if(typeof options === 'function') {
    done = options;
    opts = {};
  }
  if(!opts._locals) opts._locals = {};
  opts._locals.__view__ = name;
  app._render.call(this, name, opts, done);
};

// setup view engine
app.engine('html', swig.renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.set('view cache', false);
if(app.get('env') === 'development') {
  swig.setDefaults({ cache: false });
}

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'src')));
app.use(express.static(path.join(__dirname, 'mock')));

// load routes
var routefiles = fs.readdirSync('routes');
(function(files) {
  for(var i = 0; i < files.length; ++i) {
    if(files[i].substr(-3).toLowerCase() != '.js') continue;
    var route = require('./routes/' + files[i]);
    app.use(route.base ? route.base : '/', route);
  }
})(routefiles);

// try to access html files without extension
// or catch 404 and forward to error handler
app.use(function(req, res, next) {
  // var pathname = url.parse(req.url).pathname;
  // var filename = path.basename(pathname);
  // var extname = path.extname(pathname);
  // if(pathname.indexOf('/.') < 0 && filename[0] != '_' && !extname) {
  //   pathname = pathname.substr(0, pathname.length - extname.length);
  //   try {
  //     fs.accessSync('./views' + pathname + '.html'); // if fail, it throws
  //     res.render(pathname.substr(1));
  //     return;
  //   } catch(e) {}
  // }

  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// JSON error handler
app.use(function(err, req, res, next) {
  if(!req.xhr && !req.is('json')) {
    return next(err);
  }
  res.status(err.status || 500);
  res.send({
    code: err.status,
    message: err.message,
    object: err.detail ? err.detail : null
  });
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var server = app.listen(3000, function() {
  var host = 'localhost';
  var port = server.address().port;
  console.log('Listening at http://%s:%s', host, port);
  console.log('Use `Ctrl + C` to quit\n');
});
