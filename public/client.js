document.addEventListener("DOMContentLoaded", function () {
	var mouse = {
		click: false,
		move: false,
		pos: {
			x: 0,
			y: 0
		},
		pos_prev: false
	};
	// get canvas element and create context
	var canvas = document.getElementById('drawing');
	var context = canvas.getContext('2d');
	var width = 2000;
	var height = 2000;
	var socket = io.connect();

	// set canvas to full browser width/height
	canvas.width = width;
	canvas.height = height;
	var gridI = 25;

	function initC() {
		context.clearRect(0, 0, width, height);
		context.stroke();
		context.beginPath();
		context.font = "100px Georgia";
		context.fillStyle = "#4c4c4c";
		context.textAlign = "center";
		context.fillText("#StealRoll20", window.innerWidth * .8 / 2, window.innerHeight * 1.03 / 2);

		for (var i = 1; i < width / gridI; i++) {
			context.beginPath();
			context.lineWidth = 1;
			context.strokeStyle = "#4c4c4c";
			context.moveTo(gridI * i, 0);
			context.lineTo(gridI * i, height);
			context.stroke();
		}

		for (var i = 1; i < height / gridI; i++) {
			context.beginPath();
			context.lineWidth = 1;
			context.strokeStyle = "#4c4c4c";
			context.moveTo(0, gridI * i);
			context.lineTo(width, gridI * i);
			context.stroke();
		}
		for (var i = 0; i < height / gridI; i+=4) {
			for (var j = 0; j < width / gridI; j+=4) {
				context.beginPath();
				context.lineWidth = 1;
				context.strokeStyle = "#999999";
				context.rect(gridI * j, gridI * i, gridI * 4, gridI * 4);
				context.stroke();
			}
		}
	}	
	
	initC();

	function getMousePos(canvas, evt) {
		var rect = canvas.getBoundingClientRect();
		return {
			x: evt.clientX - rect.left,
			y: evt.clientY - rect.top
		};
	}

	var mousePos = undefined;

	canvas.addEventListener('mousemove', function (evt) {
		mousePos = getMousePos(canvas, evt);
	}, false);

	// register mouse event handlers
	canvas.onmousedown = function (e) {
		mouse.click = true;
	};
	canvas.onmouseup = function (e) {
		mouse.click = false;
	};

	canvas.onmousemove = function (e) {
		// normalize mouse position to range 0.0 - 1.0
		mouse.pos.x = mousePos.x;
		mouse.pos.y = mousePos.y;
		mouse.move = true;
	};

	// draw line received from server
	socket.on('draw_line', function (data) {
		var line = data.line;
		context.beginPath();
		context.lineWidth = "3";
		context.strokeStyle = "#e5e5e5";
		context.moveTo(line[0].x, line[0].y);
		context.lineTo(line[1].x , line[1].y);
		context.stroke();
	});

	// main loop, running every 25ms
	function mainLoop() {
		// check if the user is drawing
		if (mouse.click && mouse.move && mouse.pos_prev) {
			// send line to to the server
			socket.emit('draw_line', {
				line: [mouse.pos, mouse.pos_prev]
			});
			mouse.move = false;
		}
		mouse.pos_prev = {
			x: mouse.pos.x,
			y: mouse.pos.y
		};
		setTimeout(mainLoop, 25);
	}
	mainLoop();

	$(document).ready(function () {
		socket = io();
		var span = $('<span>').css('display', 'inline-block')
			.css('word-break', 'break-all').appendTo('body').css('visibility', 'hidden');

		var userHistory = [];
		var position = 0;
		var name = "";

		function initSpan(textarea) {
			span.text(textarea.text())
				.width(textarea.width())
				.css('font', textarea.css('font'));
		}

		$('textarea').on({
			input: function () {
				var text = $(this).val();
				span.text(text);
				$(this).height(text ? span.height() : '2em');
			},
			focus: function () {
				initSpan($(this));
			},
			keypress: function (e) {
				if (e.which == 13) {
					e.preventDefault();
					if (!name) {
						name = $('#m').val();
						$('#m').attr('placeholder', 'Name is set. Hit enter to submit.');
						$('#m').val('');
					}
					else {
						// Add command to message history.
						userHistory.push($('#m').val());
						// Set position back to last entered command.
						position = userHistory.length - 1;
						// Submit to server.
						socket.emit('chat message', name + ": " + $('#m').val());
						// Clear input.
						$('#m').val('');
					}
				}
			},
			keydown: function (e) {
				if (e.which == 38) {
					$('#m').val(userHistory[position]);
					position--;
				} else if (e.which == 40) {
					$('#m').val(userHistory[position]);
					position++;
				}
			}
		});
		socket.on('chat message', function (msg) {
			$('#messages').append($('<li>').text(msg));
		});

		socket.on('clear board', function () {
			context.beginPath();
			context.clearRect(0, 0, canvas.width, canvas.height);
			context.stroke();
			initC();
		});

		socket.on('clear chat', function () {
			$('#messages').empty();
		});
	});
});
