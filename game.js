var fs = require('fs');

var io;
var words = { 3: ['asd'], 2: ['as'], 1: ['a']};

var rooms = {};

exports.init = function(sio, socket) {
	io = sio;
	socket.emit('connected', {'text': 'You are connected!'});

	socket.on('hostCreateRoom', hostCreateRoom);
	socket.on('hostJoinRoom', hostJoinRoom);

	socket.on('hostStartRoom', hostStartRoom);
	

	socket.on('hostStartRound', hostStartRound);
	socket.on('hostRoundCollect', hostRoundCollect);

	socket.on('hostLeaveRoom', hostLeaveRoom);
	socket.on('disconnect', hostLeaveRoom);

};

function hostCreateRoom(data) {
	var roomID = ( Math.random() * 100000) | 0;

	rooms[roomID] = {};

	this.join(roomID.toString());
	this.playerName = data.playerName;
	this.joinedRoom = roomID;
	this.emit('roomCreated', {'roomID': roomID, 'playerName': data.playerName});
	this.emit('joinedRoom', {'roomID': roomID, 'playerName': data.playerName});
	

};

function hostJoinRoom(data) {
	var room = io.sockets.adapter.rooms[data.roomID];

	if (room && !rooms[data.roomID].started) {
		this.playerName = data.playerName;
		this.join(data.roomID.toString());
		this.emit('youJoinedRoom', {'roomID': data.roomID});
		io.in(data.roomID).emit('joinedRoom', data);
		
	}
	else {
		this.emit('roomError', {'text': 'This room does not exist.'})
	}
};

function hostStartRoom(data) {

	rooms[data.roomID].round = {};
	rooms[data.roomID].round.currectWord = '';
	rooms[data.roomID].round.shuffledWord = '';
	rooms[data.roomID].round.collectedWord = '';
	rooms[data.roomID].round.score = 0;
	rooms[data.roomID].round.count = 0;
	rooms[data.roomID].started = new Date();

	io.in(data.roomID).emit('roomStarted', {'roomID': data.roomID});


	hostStartRound(data);

};

function hostLeaveRoom(data) {
	if (this.joinedRoom) {
		
		this.leave( this.joinedRoom );

		if (!io.sockets.adapter.rooms[this.joinedRoom]) {
			console.log('Room %s closed.', this.joinedRoom)			
			delete rooms[this.joinedRoom];
			delete this.joinedRoom;
		}
	}
};

function hostStartRound(data) {

	var room = io.sockets.adapter.rooms[data.roomID],
		round = rooms[data.roomID].round;

	if (!checkRoundTimout(data.roomID)) {
		hostRoomFinished(data);
		return;
	}

	var roundWord = getRoundWord(Object.keys(room).length);

	round.correctWord = roundWord.correctWord;
	round.shuffledWord = roundWord.shuffledWord;
	round.collectedWord = '';
	round.count ++;

	var i = 0;
	for (var sockID in room) {

		var sock = io.sockets.connected[sockID],
			msg = {
				'roomID': data.roomID,
				'letter': round.shuffledWord[i++],
				'score': round.score,
				'started': round.started
			};

		sock.emit('roundStarted', msg);

	};

	console.log("The room %s guess the word '%s'", data.roomID, round.correctWord);
};

function hostRoundCollect(data) {
	var round = rooms[data.roomID].round;
	
	round.collectedWord += data.letter;

		if (round.correctWord.length == round.collectedWord.length) {
			if (round.correctWord == round.collectedWord) {

				round.score += 10 + round.correctWord.length * 2;
				io.sockets.in(data.roomID).emit('roundComplete', {'roomID': data.roomID, 'word': round.correctWord, 'score': round.score});
				setTimeout(function() {
					hostStartRound(data)
				}, 1000);
			} else {

				round.score -= 5 + round.correctWord.length;
				io.in(data.roomID).emit('roundFail', {'roomID': data.roomID, 'score': round.score});
				round.collectedWord = '';
				if (!checkRoundTimout(data.roomID)) {
					hostRoomFinished(data);
				}
			}
		}
};

function hostRoomFinished(data) {
	var round = rooms[data.roomID].round;
	round.started = false;

	io.in(data.roomID).emit('roomFinished', {'roomID': data.roomID, 'score': round.score, 'count': round.count});
};


function getRoundWord(l) {
	var r = (Math.random() * words[l].length ) | 0
	var word = words[l][r];
	var shuffledWord = shuffle( word.split('') ).join('');
	return {
		'correctWord': word,
		'shuffledWord': shuffledWord
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

function checkRoundTimout(roomID) {
	var started = rooms[roomID].started,
		now = new Date,
		duration = (now - started) / 1000 | 0;
	return (duration < 63);
}

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


