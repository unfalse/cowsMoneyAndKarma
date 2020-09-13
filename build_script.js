var fse = require("fs-extra");
var klawSync = require("klaw-sync");
var UglifyJS = require("uglify-js");
var babel = require("@babel/core");

if (process.argv.length < 4) {
	return;
}

var source = process.argv[2];
var target = process.argv[3];
fse.copySync(source, target);

var files = klawSync(target);
files.forEach(function (file) {
  if (file.path.slice(-3) === ".js") {
    var contents = fse.readFileSync(file.path, 'utf8');
    babel.transform(contents, {
			presets: ["@babel/preset-env"],
		}, function(err, result) {
    	if(err) {
				console.log('Babel error: ',err);
			} else {
				var minifyObj = UglifyJS.minify(result.code);
				if(minifyObj.error) {
					console.log("UglifyJS error:", minifyObj.error);
					console.log("File path:", file.path);
				} else {
					fse.writeFileSync(file.path, minifyObj.code);
				}
			}
    });
  }
});
