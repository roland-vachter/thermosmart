const OutsideConditionHistory = require('../models/OutsideConditionHistory');
const outsideConditions = require('./outsideConditions');

const HeatingHistory = require('../models/HeatingHistory');
const heatingService = require('./heating.js');

const TargetTempHistory = require('../models/TargetTempHistory');
const targetTempService = require('./targetTemp');

const moment = require('moment-timezone');


outsideConditions.evts.on('change', values => {
	if (values && !isNaN(values.temperature) && !isNaN(values.humidity)) {
		new OutsideConditionHistory({
			datetime: new Date(),
			t: values.temperature,
			h: values.humidity
		}).save();
	}
});

heatingService.evts.on('change', status => {
	HeatingHistory
		.findOne()
		.sort({
			datetime: -1
		})
		.exec()
		.then((result) => {
			if (!result || result.status !== status) {
				new HeatingHistory({
					datetime: new Date(),
					status: status
				}).save();
			}
		});
});


function monitorTargetTemp () {
	targetTempService().then(target => {
		TargetTempHistory
			.findOne()
			.sort({
				datetime: -1
			})
			.exec()
			.then((result) => {
				if (!result || result.t !== target) {
					new TargetTempHistory({
						datetime: new Date(),
						t: target
					}).save();
				}
			});
		});
}
monitorTargetTemp();
setInterval(monitorTargetTemp, 60000);


function getHeatingDuration () {
	return Promise.all([
		HeatingHistory
			.findOne({
				datetime: {
					$gt: moment().tz("Europe/Bucharest").subtract(1, 'days').startOf('day'),
					$lt: moment().tz("Europe/Bucharest").subtract(1, 'days').endOf('day')
				}
			})
			.sort({
				datetime: -1
			})
			.exec(),
		HeatingHistory
			.find({
				datetime: {
					$gt: moment().tz("Europe/Bucharest").startOf('day')
				}
			})
			.exec()
	]).then(results => {
		results = [results[0], ...results[1]];

		if (!results[0]) {
			results[0] = {
				datetime: moment().tz("Europe/Bucharest").startOf('day'),
				status: results[1] ? !results[1].status : false
			};
		}

		results[0].datetime = moment().tz("Europe/Bucharest").startOf('day');

		let heatingDuration = 0; // minutes
		let lastEntry = null;

		results.forEach(entry => {
			if (lastEntry) {
				if (lastEntry.status === true && entry.status === false) {
					heatingDuration += (entry.datetime.getTime() - lastEntry.datetime.getTime()) / 60000;
				}

				if (lastEntry.status !== entry.status) {
					lastEntry = entry;
				}
			} else {
				lastEntry = entry;
			}
		});

		if (lastEntry.status === true) {
			heatingDuration += (new Date().getTime() - lastEntry.datetime.getTime()) / 60000;
		}

		return Math.round(heatingDuration);
	});
}


exports.getStatisticsForToday = function () {
	return Promise.all([
		getHeatingDuration()
	]).then(results => {
		return {
			heatingDuration: results[0]
		};
	});
};
