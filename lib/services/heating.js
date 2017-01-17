const HeatingDefaultPlan = require('../models/HeatingDefaultPlan');
const HeatingHistory = require('../models/HeatingHistory');
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
	let activeCount = 0;
	keys.forEach(key => {
		if (data[key].active) {
			avgValues.temperature += data[key].temperature;
			avgValues.humidity += data[key].humidity;
			activeCount++;
		}
	});

	avgValues.temperature = avgValues.temperature / activeCount;

	if (!initialized) {
		initialized = true;
	}

	updateHeatingStatus();
});

exports.isHeatingOn = () => {
	return isOn;
};

exports.evts = evts;


function turnHeatingOn () {
	isOn = true;
	evts.emit('change', isOn);

	HeatingHistory
		.findOne()
		.sort({datetime: -1})
		.exec()
		.then((result) => {
			if (result && result.status === false) {
				new HeatingHistory({
					datetime: new Date(),
					status: isOn
				}).save();
			}
		});

	console.log('heating turned on');
}

function turnHeatingOff () {
	isOn = false;
	evts.emit('change', isOn);

	HeatingHistory
		.findOne()
		.sort({datetime: -1})
		.exec()
		.then((result) => {
			if (result && result.status === true) {
				new HeatingHistory({
					datetime: new Date(),
					status: isOn
				}).save();
			}
		});

	console.log('heating turned off');
}

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
				turnHeatingOn();
			} else if (isOn && avgValues.temperature >= targetTemp.value + 0.2) {
				turnHeatingOff();
			}
		}
	}).catch((err) => {
		console.log("Error occured while fetching the heating plan for today", err);
	});
}
setInterval(updateHeatingStatus, 10000);
