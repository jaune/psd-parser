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

    _send(req, path)
        // .root(_path.join(__dirname, 'build', 'gae'))
        .root(__dirname)
        .on('error', error)
        .pipe(res);

}).listen(80);

