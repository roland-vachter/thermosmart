const HeatingDefaultPlan = require('../models/HeatingDefaultPlan');
const insideConditions = require('./insideConditions');

const EventEmitter = require('events');
const evts = new EventEmitter();

let isOn = false;
const sensorData = {
	temperature: 0,
	humidity: 0
};

let initialized = false;

insideConditions.evts.on('change', data => {
	sensorData.temperature = data.temperature;
	sensorData.humidity = data.humidity;

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

			const today = new Date();

			todaysPlan.plan.intervals.forEach(interval => {
				if (today.getHours() >= interval.startHour &&
						today.getMinutes() >= interval.startMinute) {
					targetTemp = interval.temp;
				}
			});

			if (!isOn && sensorData.temperature <= targetTemp.value - 0.2) {
				isOn = true;
				console.log('heating turned on');
			} else if (isOn && sensorData.temperature >= targetTemp.value + 0.2) {
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
