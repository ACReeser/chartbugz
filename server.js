//var cors_proxy = require("adhoc-cors-proxy");
//console.log(cors_proxy);
//cors_proxy({ target: "google.com" });
var request = require('request');
var express = require('express');
var app = express();

app.use(express.static('root'));

if (process.argv.length < 3)
    throw "fogbugz subdomain required";

var subdomain = process.argv[2];
var apiServerHost = "https://"+subdomain+".fogbugz.com";

app.use('/proxy', function (req, res) {
    var url = apiServerHost + req.url;
    req.pipe(request(url)).pipe(res);
});

app.listen(80);
