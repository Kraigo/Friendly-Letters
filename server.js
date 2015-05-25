var express = require('express'),
    path = require('path');

app = express();
game = require('./game');
app.use(express.static('public'));

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

var server = require('http').createServer(app).listen(server_port, server_ip_address);


io.sockets.on('connection', function(socket) {
    game.init(io, socket);
});