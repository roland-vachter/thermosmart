const socket = require('../services/socketio');
const heatingService = require('../services/heating');

const authorizedSockets = [];

function isSocketAuthorized (socket) {
	return authorizedSockets.indexOf(socket) !== -1;
}

exports.init = function () {
	const frontendIo = socket.io.of('/sensor');

	frontendIo.on('connection', (socket) => {
		socket.on('disconnect', () => {
			if (isSocketAuthorized(socket)) {
				authorizedSockets.splice(authorizedSockets.indexOf(socket), 1);
			}
		});

		socket.on('authorize', (data) => {
			if (data.key === process.env.AUTHORIZATION_KEY) {
				authorizedSockets.push(socket);
			}
		});

		socket.on('sensorChange', (data) => {
			if (isSocketAuthorized(socket)) {
				heatingService.setSensorData(data);
			}
		});
	});
};
