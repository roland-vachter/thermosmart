const outsideConditions = require('../services/outsideConditions');
const insideConditions = require('../services/insideConditions');
const Temperature = require('../models/Temperature');
const HeatingPlan = require('../models/HeatingPlan');
const HeatingDefaultPlan = require('../models/HeatingDefaultPlan');
const HeatingHistory = require('../models/HeatingHistory');
const heatingService = require('../services/heating');
const statisticsService = require('../services/statistics');
const security = require('../services/security');

const moment = require('moment-timezone');

exports.init = function (req, res, next) {
	Promise.all([
		Temperature
			.find()
			.exec(),
		HeatingDefaultPlan
			.find()
			.exec(),
		HeatingPlan
			.find()
			.exec(),
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
			temps,
			heatingDefaultPlans,
			heatingPlans,
			heatingHistoryLast24,
			statisticsForToday
		] = results;

		res.json({
			status: 'ok',
			data: {
				outside: outsideConditions.get(),
				inside: insideConditions.get(),
				isHeatingOn: heatingService.isHeatingOn(),
				temperatures: temps,
				heatingPlans: heatingPlans,
				heatingDefaultPlans: heatingDefaultPlans,
				heatingHistoryLast24: heatingHistoryLast24,
				statisticsForToday: statisticsForToday,
				security: {
					status: security.getStatus()
				}
			}
		});
	}).catch(next);
};

exports.tempAdjust = function (req, res, next) {
	if (isNaN(req.body._id) || isNaN(req.body.value)) {
		res.status(400).json({
			status: 'error',
			message: 'Missing or incorrect parameters'
		});
		return;
	}

	Temperature.findOneAndUpdate({
		_id: req.body._id
	}, {
		value: parseFloat(req.body.value)
	})
	.exec()
	.then(temp => {
		if (temp) {
			Temperature.triggerChange(temp._id);

			res.json({
				status: 'ok',
				temp: temp
			});
		} else {
			res.json({
				status: 'error',
				message: 'Temperature was not found'
			});
		}
	})
	.catch(next);
};

exports.changeDefaultPlan = function (req, res, next) {
	if (isNaN(req.body.dayOfWeek) || isNaN(req.body.planId)) {
		res.status(400).json({
			status: 'error',
			message: 'Missing or incorrect parameters'
		});
		return;
	}

	HeatingDefaultPlan.findOneAndUpdate({
		dayOfWeek: req.body.dayOfWeek
	}, {
		plan: req.body.planId
	})
	.exec()
	.then(heatingDefaultPlan => {
		if (heatingDefaultPlan) {
			HeatingDefaultPlan.triggerChange(heatingDefaultPlan._id);

			res.json({
				status: 'ok',
				plan: heatingDefaultPlan
			});
		} else {
			res.json({
				status: 'error',
				message: 'Heating plan was not found.'
			});
		}
	})
	.catch(next);
};

exports.securityToggleAlarm = function (req, res) {
	security.toggleArm();

	res.sendStatus(200);
};

exports.sensorPolling = function (req, res) {
	if (req.query.move) {
		security.movementDetected();
	}

	if (!isNaN(req.query.t) && !isNaN(req.query.h)) {
		const id = req.query.id || 1;

		insideConditions.set({
			id: id,
			temperature: parseFloat(req.query.t),
			humidity: parseFloat(req.query.h)
		});

		setTimeout(() => res.json({
			isHeatingOn: heatingService.isHeatingOn()
		}), 200);
	} else {
		res.json({
			status: security.getStatus()
		});
	}
};

exports.statistics = async function (req, res) {
	const results = await statisticsService.getStatisticsForInterval(moment(req.query.startDate).tz("Europe/Bucharest"), moment(req.query.endDate).tz("Europe/Bucharest"));
	res.json(results);
};
