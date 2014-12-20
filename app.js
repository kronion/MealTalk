var express = require('express'),
    app = express();

var bodyParser = require('body-parser');
var compress = require('compression');

var CAS = require('cas');
var cas_url = 'https://fed.princeton.edu/cas/';
var cas = new CAS({ base_url: cas_url, service: 'http://localhost:8181/test' });

var port = process.argv[2] || 8181;

var staticFileOptions = {
  root: __dirname + '/public',
  dotfiles: 'deny'
};

app.use(compress())
   .use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(req, res) {
  res.redirect(cas_url + 'login?service=http://localhost:8181/test');
});

app.get('/test', function(req, res) {
  var ticket = req.param('ticket');
  if (ticket) {
    cas.validate(ticket, function(err, status, username) {
      if (err) {
        res.send({ error: err });
      }
      else {
        res.send({ status: status, username: username });
      }
    });
  }
  else {
    res.redirect('/');
  }
});

app.post('/login', function(req, res) {
  console.log(req.body);
});

app.use(function(req, res, next) {
  res.status(404).sendFile('404.html', staticFileOptions);
});

app.use(express.static(__dirname + '/public'));

var server = app.listen(port, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Server listening at http://%s:%s', host, port);
});
