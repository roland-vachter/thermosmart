"use strict";

const socket = require('../services/socketio');
const outsideConditions = require('../services/outsideConditions');
const insideConditions = require('../services/insideConditions');
const heatingService = require('../services/heating');
const statisticsService = require('../services/statistics');
const Temperature = require('../models/Temperature');
const HeatingDefaultPlan = require('../models/HeatingDefaultPlan');
const HeatingHistory = require('../models/HeatingHistory');

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

	HeatingDefaultPlan.evts.on('change', ids => {
		if (!(ids instanceof Array)) {
			ids = [ids];
		}

		HeatingDefaultPlan.find({
			_id: {
				$in: ids
			}
		}).exec().then(plans => {
			frontendIo.emit('update', {
				heatingDefaultPlans: plans
			});
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

			frontendIo.emit('update', {
				heatingHistoryLast24: heatingHistoryLast24,
				statisticsForToday: statisticsForToday
			});
		});
	}, 5 * 60 * 1000);
};
