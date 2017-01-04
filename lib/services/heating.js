const HeatingDefaultPlan = require('../models/HeatingDefaultPlan');
const insideConditions = require('./insideConditions');

const EventEmitter = require('events');
const evts = new EventEmitter();

const moment = require('moment-timezone');

let isOn = false;
const avgValues = {
	temperature: 0,
	humidity: 0
};

let initialized = false;

insideConditions.evts.on('change', data => {
	avgValues.temperature = 0;
	avgValues.humidity = 0;

	const keys = Object.keys(data);
	keys.forEach(key => {
		avgValues.temperature += data[key].temperature;
		avgValues.humidity += data[key].humidity;
	});

	avgValues.temperature = avgValues.temperature / keys.length;

	if (!initialized) {
		initialized = true;
	}

	updateHeatingStatus();
});

exports.isHeatingOn = () => {
	return isOn;
};

exports.evts = evts;



function updateHeatingStatus () {
	if (!initialized) {
		return Promise.resolve();
	}

	return HeatingDefaultPlan.findOne({
		dayOfWeek: new Date().getDay()
	})
	.populate({
		path: 'plan',
		populate: {
			path: 'intervals.temp'
		}
	})
	.exec()
	.then(todaysPlan => {
		if (todaysPlan) {
			let targetTemp;

			const now = moment().tz("Europe/Bucharest");
			const nowHours = now.hours();
			const nowMinutes = now.minutes();

			todaysPlan.plan.intervals.forEach(interval => {
				if (nowHours > interval.startHour ||
						(nowHours === interval.startHour &&
						nowMinutes >= interval.startMinute)) {
					targetTemp = interval.temp;
				}
			});

			if (!isOn && avgValues.temperature <= targetTemp.value - 0.2) {
				isOn = true;
				console.log('heating turned on');
			} else if (isOn && avgValues.temperature >= targetTemp.value + 0.2) {
				isOn = false;
				console.log('heating turned off');
			}

			evts.emit('change', isOn);
		}
	}).catch((err) => {
		console.log("Error occured while fetching the heating plan for today", err);
	});
}
setInterval(updateHeatingStatus, 10000);
