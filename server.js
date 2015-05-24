var express = require('express'),
    path = require('path');

app = express();
game = require('./game');
app.use(express.static('public'));

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP

var server = require('http').createServer(app).listen(server_port, server_ip_address);
var io = require('socket.io').listen(server);


io.sockets.on('connection', function(socket) {
    game.init(io, socket);
});