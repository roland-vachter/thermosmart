const outsideConditions = require('../services/outsideConditions');
const insideConditions = require('../services/insideConditions');
const Temperature = require('../models/Temperature');
const HeatingPlan = require('../models/HeatingPlan');
const HeatingDefaultPlan = require('../models/HeatingDefaultPlan');
const heatingService = require('../services/heating');

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
			.exec()
	]).then(results => {
		const temps = results[0];
		const heatingDefaultPlans = results[1];
		const heatingPlans = results[2];

		res.json({
			status: 'ok',
			data: {
				outside: outsideConditions.get(),
				inside: insideConditions.get(),
				isHeatingOn: heatingService.isHeatingOn(),
				temperatures: temps,
				heatingPlans: heatingPlans,
				heatingDefaultPlans: heatingDefaultPlans
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

exports.sensorPolling = function (req, res) {
	if (!isNaN(req.query.t) && !isNaN(req.query.h)) {
		const id = req.query.id || 1;

		insideConditions.set({
			id: id,
			temperature: parseFloat(req.query.t),
			humidity: parseFloat(req.query.h)
		});
	}

	setTimeout(() => res.json({
		isHeatingOn: heatingService.isHeatingOn()
	}), 200);
};
