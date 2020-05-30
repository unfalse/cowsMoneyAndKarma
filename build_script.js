var fse = require("fs-extra");
var klawSync = require("klaw-sync");
var minify = require("babel-minify");

if (process.argv.length < 4) {
  return;
}
// "build": "cp-cli \"src/*.{html,css}\" \"dist/\" && cp-cli \"src/img/*\" \"dist/img/\" && cp-cli \"src/sound/*\" \"dist/sound/\" && minify src -d dist --mangle"
var source = process.argv[2];
var target = process.argv[3];
fse.copySync(source, target);

var files = klawSync(target);
files.forEach(function (file) {
  if (file.path.slice(-3) === ".js") {
    var contents = fse.readFileSync(file.path);
    var minifyObj = minify(contents, {
      mangle: {
        keepClassName: true,
      },
    });
    fse.writeFileSync(file.path, minifyObj.code);
  }
});
