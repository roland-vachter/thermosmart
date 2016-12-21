"use strict";

const socket = require('../services/socketio');
const outsideConditions = require('../services/outsideConditions');
const Temperature = require('../models/Temperature');

exports.init = function () {
	const frontendIo = socket.io.of('/frontend');

	outsideConditions.evts.on('change', data => {
		frontendIo.emit('update', {
			outside: data
		});
	});

	Temperature.evts.on('change', ids => {
		console.log('change handled');

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
		})
	});
};
