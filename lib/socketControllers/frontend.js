"use strict";

const socket = require('../services/socketio');
const outsideConditions = require('../services/outsideConditions');
const insideConditions = require('../services/insideConditions');
const heatingService = require('../services/heating');
const Temperature = require('../models/Temperature');

exports.init = function () {
	const frontendIo = socket.io.of('/frontend');

	outsideConditions.evts.on('change', data => {
		frontendIo.emit('update', {
			outside: data
		});
	});

	insideConditions.evts.on('change', data => {
		frontendIo.emit('update', {
			inside: data
		});
	});

	heatingService.evts.on('change', data => {
		frontendIo.emit('update', {
			isHeatingOn: data
		});
	});

	Temperature.evts.on('change', ids => {
		if (!(ids instanceof Array)) {
			ids = [ids];
		}

		Temperature.find({
			_id: {
				$in: ids
			}
		}).exec().then(temps => {
			frontendIo.emit('update', {
				temperatures: temps
			});
		});
	});
};
