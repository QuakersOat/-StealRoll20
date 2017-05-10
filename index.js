var express = require('express'),
	app = express(),
	http = require('http'),
	socketIo = require('socket.io'),
	fs = require('fs');
var canvas = require('./public/canvas.json');

var server = http.createServer(app);
var io = socketIo.listen(server);
server.listen(6660);
app.use(express.static(__dirname + '/public'));
console.log("Server running on 127.0.0.1:6660");

function save(fileName, file) {
	fs.writeFile(fileName + '.json', JSON.stringify(file), function (err) {
		if (err) return console.log(err);
	});
}

io.on('connection', function (socket) {
	for (var i in canvas) {
		socket.emit('draw_line', {
			line: canvas[i]
		});
	}

	socket.on('draw_line', function (data) {
		canvas.push(data.line);
		io.emit('draw_line', {
			line: data.line
		});
	});

	socket.on('chat message', function (msg) {
		if (msg.match(/.*\: \/clearb/i)) {
			io.emit('clear board');
			canvas = [];
			save("./public/canvas", canvas);
		}
		else if (msg.match(/.*\: \/clearc/i)) {
			io.emit('clear chat');
		}
		else {
			io.emit('chat message', msg);
		}
	});
});

process.on('SIGINT', function (e) {
	save('./public/canvas', canvas)
});