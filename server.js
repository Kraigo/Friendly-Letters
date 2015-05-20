var express = require('express'),
    path = require('path');

app = express();
game = require('./game');
app.use(express.static('public'));

var server = require('http').createServer(app).listen(80);
var io = require('socket.io').listen(server);


io.sockets.on('connection', function(socket) {
    game.init(io, socket);
});