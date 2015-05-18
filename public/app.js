	window.onload = function() {
		app.init();
	};

	var socket = io.connect();

	var app = new function() {
		var app = this;

		this.init = function() {
			this.initData();
			bindEvents();
			view('login', {'%playerName%': '', '%disabled%': 'disabled'});
		};

		this.initData = function() {
			this.roomID = 0;
			this.playerName = '';
			this.letter = '';
			this.step = true;
			this.isHost = false;
		};


		this.host = {
			createRoom: function() {
				socket.emit('hostCreateRoom', {'playerName': app.playerName});
			},
			joinRoom: function() {
				socket.emit('hostJoinRoom', {'playerName': app.playerName, 'roomID': app.roomID});
			},
			startRoom: function() {
				socket.emit('hostStartRoom', {'roomID': app.roomID});
			},
			roundStep: function() {
				socket.emit('hostRoundStep', {'roomID': app.roomID, 'letter': app.letter});
			}
		};


		/* View */

		this.viewCache = {
			'game': document.querySelector('#game-view'),
			'login': document.querySelector('#login-view').innerHTML,
			'room': document.querySelector('#room-view').innerHTML,
			'lobby': document.querySelector('#lobby-view').innerHTML,
			'round': document.querySelector('#round-view').innerHTML
		};

		function view(title, data) {
			var targetView = app.viewCache[title];

			if (data) {
				for(var index in data) {
					targetView = targetView.replace(new RegExp(index, "g"), data[index]);
				}
			}

			app.viewCache.game.innerHTML = targetView;
		};


		/* Validation */

		this.validLogin = function(event) {
			if (event.target.value) {
				app.playerName = event.target.value;
				document.querySelector('#login-control').className = '';
				return;
			}
			document.querySelector('#login-control').className = 'disabled';

		};

		this.validRoom = function(event) {
			if (event.target.value) {
				app.roomID = event.target.value;
				document.querySelector('#room-control').className = '';
				return;
			}
			document.querySelector('#room-control').className = 'disabled';
		};

		this.joinLobby = function() {
			view('lobby');
		};

		this.roundStep = function(event) {
			if (app.step) {
				document.querySelector('#round').className = 'round selected';
				app.host.roundStep();
				app.step = false;
			}
		};
		this.exitRoom = function() {
			view('login', {'%playerName%': app.playerName, '%disabled%': ''});
			app.initData();
		}


		/* Events */

		function bindEvents() {
			socket.on('connected', onConnected);
			socket.on('roomCreated', onRoomCreated);
			socket.on('joinedRoom', onJoinedRoom);
			socket.on('youJoinedRoom', onYouJoinedRoom);

			socket.on('roundStarted', onRoundStarted);
			socket.on('roundComplete', onRoundComplete);
			socket.on('roundFail', onRoundFail);
		};

		function onConnected(data) {
			console.log(data.text);
		};

		function onRoomCreated(data) {
			app.roomID = data.roomID;
			app.isHost = true;
			view('room', {'%roomID%': app.roomID, '%host%': 'show'});

		};
		function onJoinedRoom(data) {
			var li = document.createElement('span');
			li.className = 'playerName';
			li.style.color = getRendomColor();
			li.innerHTML = data.playerName;
			document.querySelector('#roomList').appendChild(li);
		};
		function onYouJoinedRoom(data) {
			view('room', {'%roomID%': data.roomID, '%host%': ''});
		};

		function onRoundStarted(data) {
			app.letter = data.letter;
			app.step = true;
			view('round', {'%letter%': data.letter, '%host%': app.isHost?'show':''});
		};

		function onRoundComplete(data) {
			document.querySelector('#round-complete').className += ' show';
			document.querySelector('#round-complete-word').innerHTML = data.word;

		};

		function onRoundFail(data) {
			document.querySelector('#round').className = 'round failed';
			app.step = true;

			setTimeout(function() {
				document.querySelector('#round').className = 'round';
			}, 1000)
		};

		/* Client */

		function getRendomColor() {
			var colors = ['#2D95BF', '#4EBA6F', '#955BA5', '#F0C419', '#F15A5A'];
			var r = (Math.random() * colors.length) | 0;
			return colors[r];
		};
	};