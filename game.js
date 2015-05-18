var fs = require('fs');

var io;
var gameSocket;
var words = {};

exports.init = function(sio, socket) {
	io = sio;
	gameSocket = socket;
	gameSocket.emit('connected', {'text': 'You are connected!'});

	gameSocket.on('hostCreateRoom', hostCreateRoom);
	gameSocket.on('hostStartRoom', hostStartRoom);

	gameSocket.on('hostJoinRoom', hostJoinRoom);

	gameSocket.on('hostRoundStep', hostRoundStep);
};

function hostCreateRoom(data) {
	var roomID = ( Math.random() * 100000) | 0;

	this.join(roomID.toString());

	gameSocket.playerName = data.playerName;
	this.emit('roomCreated', {'roomID': roomID, 'playerName': data.playerName});
	this.emit('joinedRoom', {'roomID': roomID, 'playerName': data.playerName});
	

};
function hostStartRoom(data) {
	var room = io.sockets.adapter.rooms[data.roomID];
	var roomLength =  Object.keys(room).length;

	var word = io.sockets.in(data.roomID).word = getRoundWord(roomLength);
	word.round = '';

	console.log("Room %s started. Source word is '%s'", data.roomID, word.source);

	var i = 0;
	for (var sockID in room) {
		var sock = io.sockets.connected[sockID];
		var msg = {
			'roomID': data.roomID,
			'letter': word.shuffled[i++]
		};
		sock.emit('roundStarted', msg);
	};

};

function hostRoundStep(data) {
	var word = io.sockets.in(data.roomID).word
	word.round += data.letter;

	if (word.source.length == word.round.length) {
		if (word.source == word.round) {
			io.sockets.in(data.roomID).emit('roundComplete', {'roomID': data.roomID, 'word': word.source});
		} else {
			io.sockets.in(data.roomID).emit('roundFail', {'roomID': data.roomID});
			word.round = '';
		}
	}
}

function hostJoinRoom(data) {
	var room = gameSocket.adapter.rooms[data.roomID];

	if (room) {
		gameSocket.playerName = data.playerName;
		this.join(data.roomID.toString());
		this.emit('youJoinedRoom', {'roomID': data.roomID});
		io.sockets.in(data.roomID).emit('joinedRoom', data);
		
	}
	else {
		this.emit('roomError', {'text': 'This room does not exist.'})
	}
};

function getRoundWord(l) {
	var r = (Math.random() * words[l].length ) | 0
	var word = words[l][r];
	var shuffledWord = shuffle( word.split('') ).join('');
	return {
		'source': word,
		'shuffled': shuffledWord
	}
}

function shuffle(array) {
	var currentIndex = array.length, temporaryValue, randomIndex ;

	while (0 !== currentIndex) {

		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}

(function() {
	fs.readFile('./words.txt', {encoding: 'utf-8'}, function(err, data) {
		data = data.replace(/^\uFEFF/, '');
		var mas = data.split(', ')
		for (var i = mas.length; i > 0; i--) {
			var m = mas[i-1]

			if (!words[m.length])
				words[m.length] = [];

			words[m.length].push(m);
		};

	});

})();


