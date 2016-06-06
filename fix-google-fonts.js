var fs = require('fs');

// fonts.css.network
// fonts.lug.ustc.edu.cn

function replace_google_fonts(path) {
  var data = fs.readFileSync(path).toString();
  if(data.indexOf('fonts.googleapis.com') > -1) {
    data = data.replace(/(https?:)?\/\/fonts\.googleapis\.com/g, 'http://fonts.lug.ustc.edu.cn');
    fs.writeFileSync(path, data);
  }
}

function replace_adminlte_fonts(path) {
  var data = fs.readFileSync(path).toString();
  if(data.indexOf('fonts.googleapis.com') > -1) {
    data = data.replace(/url\(['"]?(https?:)?\/\/fonts\.googleapis\.com\/.+?['"]?\)/g, 'url(/assets/css/source-sans-pro.css)');
    fs.writeFileSync(path, data);
  }
}

replace_google_fonts('./public/assets/vendor/AdminLTE/dist/css/AdminLTE.css');
replace_google_fonts('./public/assets/vendor/AdminLTE/dist/css/AdminLTE.min.css');
