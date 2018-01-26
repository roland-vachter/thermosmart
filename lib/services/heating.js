const insideConditions = require('./insideConditions');
const targetTempService = require('./targetTemp');

const EventEmitter = require('events');
const evts = new EventEmitter();

let isOn = false;
let lastChangeEventStatus;
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
	if (lastChangeEventStatus !== isOn) {
		evts.emit('change', isOn);
		console.log('heating turned on');
	}
	lastChangeEventStatus = isOn;
}

function turnHeatingOff () {
	isOn = false;
	if (lastChangeEventStatus !== isOn) {
		evts.emit('change', isOn);
		console.log('heating turned off');
	}
	lastChangeEventStatus = isOn;
}

function updateHeatingStatus () {
	if (!initialized) {
		return Promise.resolve();
	}

	return targetTempService().then(target => {
		if (!isOn && avgValues.temperature <= target - 0.2) {
			turnHeatingOn();
		} else if (avgValues.temperature >= target + 0.1) {
			turnHeatingOff();
		}
	}).catch((err) => {
		console.log("Error occured while fetching the heating plan for today", err);
	});
}
setInterval(updateHeatingStatus, 10000);
