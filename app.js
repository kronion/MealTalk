var express = require('express'),
    app = express();

var bodyParser = require('body-parser'),
    compress   = require('compression'),
    session    = require('cookie-session');


var CAS = require('cas');
var cas_url = 'https://fed.princeton.edu/cas/';
var cas = new CAS({ base_url: cas_url, service: 'http://localhost:8181/verify' });

var port = process.argv[2] || 8181;

var staticFileOptions = {
  root: __dirname + '/public',
  dotfiles: 'deny'
};

app.use(compress())
   .use(bodyParser.urlencoded({ extended: true }))
   .use(session({ keys: ['key1', 'key2'] }));

app.get('/', function(req, res) {
  if (req.session.cas) {
    res.render('index.jade', req.session.cas);
  }
  else {
    res.sendFile('index.html', staticFileOptions);
  }
});

app.get('/login', function(req, res) {
  res.redirect(cas_url + 'login?service=http://localhost:8181/verify');
});

app.get('/verify', function(req, res) {
  if (!req.session.cas) {
    var ticket = req.param('ticket');
    if (ticket) {
      cas.validate(ticket, function(err, status, username) {
        if (err) {
          res.send({ error: err });
        }
        else {
          req.session.cas = { age: 'new', status: status, username: username };
          res.redirect('/');
        }
      });
    }
    else {
      res.redirect('/');
    }
  }
  else {
    res.redirect('/');
  }
});

app.get('/logout', function(req, res) {
  req.session = null;
  res.redirect('https://fed.princeton.edu/cas/logout');
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
