"use strict";

const socket = require('../services/socketio');
const outsideConditions = require('../services/outsideConditions');

exports.init = function () {
	const frontendIo = socket.io.of('/frontend');

	frontendIo.on('connection', () => {

	});

	outsideConditions.evts.on('change', (data) => {
		frontendIo.emit('update', {
			outside: data
		});
	});
};
