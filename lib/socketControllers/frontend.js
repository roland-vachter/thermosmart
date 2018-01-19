"use strict";

const socket = require('../services/socketio');
const outsideConditions = require('../services/outsideConditions');
const insideConditions = require('../services/insideConditions');
const heatingService = require('../services/heating');
const statisticsService = require('../services/statistics');
const security = require('../services/security');
const restartSensorService = require('../services/restartSensor');
const Temperature = require('../models/Temperature');
const HeatingDefaultPlan = require('../models/HeatingDefaultPlan');
const HeatingHistory = require('../models/HeatingHistory');

exports.init = function () {
	const io = socket.io.of('/frontend');


	// heating

	outsideConditions.evts.on('change', data => {
		io.emit('update', {
			outside: data
		});
	});

	insideConditions.evts.on('change', data => {
		io.emit('update', {
			inside: data
		});
	});

	heatingService.evts.on('change', data => {
		io.emit('update', {
			isHeatingOn: data
		});
	});

	restartSensorService.evts.on('change', data => {
		io.emit('update', {
			restartSensorInProgress: data
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
			io.emit('update', {
				temperatures: temps
			});
		});
	});

	HeatingDefaultPlan.evts.on('change', defaultPlan => {
		io.emit('update', {
			heatingDefaultPlans: [defaultPlan]
		});
	});


	setInterval(() => {
		Promise.all([
			HeatingHistory
				.find({
					datetime: {
						$gt: new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
					}
				})
				.exec(),
			statisticsService
				.getStatisticsForToday()
		]).then(results => {
			const [
				heatingHistoryLast24,
				statisticsForToday
			] = results;

			io.emit('update', {
				heatingHistoryLast24: heatingHistoryLast24,
				statisticsForToday: statisticsForToday
			});
		});
	}, 5 * 60 * 1000);



	// security
	security.evts.on('status', data => {
		io.emit('update', {
			security: {
				status: data
			}
		});
	});

	security.evts.on('alarm', data => {
		io.emit('update', {
			security: {
				alarm: data
			}
		});
	});
};
