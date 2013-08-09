/*
var _path = require('path'),
    _psd_parser = require(_path.join(__dirname, 'source'));

var Parser = _psd_parser.LocalFileParser;

var parser = new Parser();

parser.parse(_path.join(__dirname, 'resource', '960-grid-template-v1.psd'), function (error) {
    if (error) throw error;
    console.log('done !');
});
*/



var _http = require('http'),
    _path = require('path'),
    _send = require('send'),
    _url = require('url');

_http.createServer(function(req, res){
    // your custom error-handling logic:
    function error(err) {
        res.statusCode = err.status || 500;
        res.end(err.message);
    }

    var path = _url.parse(req.url).pathname;

    if (path === '/asset/main.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });

        var browserify = require('browserify');
        var b = browserify();
        b.add(_path.join(__dirname, 'build', 'gae', 'asset', 'main.js'));
        b.bundle({
            debug: true
        }).pipe(res);
    } else {
        _send(req, path)
            .root(_path.join(__dirname, 'build', 'gae'))
            .on('error', error)
            .pipe(res);
    }
}).listen(80);

