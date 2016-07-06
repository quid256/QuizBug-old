var http = require("http");
var express = require("express");
var fs = require('fs');
var PORT = 8080;

var app = express();

app.use("/css", express.static("css"));
app.use("/dist", express.static("bundle"));

app.get("/", function(req, res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end(fs.readFileSync('quizbug-react.html'));
});

app.get("/php/searchDatabase.php", function(req, res) {
	function serialize(obj) {
	  var str = [];
	  for(var p in obj)
	     str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
	  return str.join("&");
	}
	while (true) {
		try {
			console.log("http://quinterest.org/php/searchDatabase.php?" + serialize(req.query));
			http.get("http://quinterest.org/php/searchDatabase.php?" + serialize(req.query), function(getres) {
				var totData = '';
				getres.on('data', function(chunk) {
					totData += chunk;
				});

				getres.on('end', function() {
					res.writeHead(200, {'Content-Type': 'text/plain'});
					res.end(totData);
				});
			});
			break;
		} catch(e) {
			console.log(e);
		}

	}

});

app.get("/php/loadSubcategories.php", function(req, res) {
	function serialize(obj) {
	  var str = [];
	  for(var p in obj)
	     str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
	  return str.join("&");
	}
	console.log("http://quinterest.org/php/loadSubcategories.php?" + serialize(req.query));
	http.get("http://quinterest.org/php/loadSubcategories.php?" + serialize(req.query), function(getres) {
		var totData = '';
		getres.on('data', function(chunk) {
			totData += chunk;
		});

		getres.on('end', function() {
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end(totData);
		});
	});
});

app.get("/php/loadTournaments.php", function(req, res) {
	function serialize(obj) {
	  var str = [];
	  for(var p in obj)
	     str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
	  return str.join("&");
	}
	console.log("Get Request routed for: ", "http://quinterest.org/php/loadTournaments.php?" + serialize(req.query));
	http.get("http://quinterest.org/php/loadTournaments.php?" + serialize(req.query), function(getres) {
		var totData = '';
		getres.on('data', function(chunk) {
			totData += chunk;
		});

		getres.on('end', function() {
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end(totData);
		});
	});
});



app.listen(PORT);
