const insideConditions = require('./insideConditions');
const targetTempService = require('./targetTemp');

const EventEmitter = require('events');
const evts = new EventEmitter();

let isOn = false;
const avgValues = {
	temperature: 0,
	humidity: 0
};

let initialized = false;
let heatingPaused = false;

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

	console.log('heating turned on');
}

function turnHeatingOff () {
	isOn = false;
	evts.emit('change', isOn);

	console.log('heating turned off');
}

let pauseCounter;
function initPauseCounter () {
	pauseCounter = setTimeout(() => {
		heatingPaused = true;
		turnHeatingOff();

		pauseCounter = setTimeout(() => {
			heatingPaused = false;
			turnHeatingOn();

			initPauseCounter();
		}, 0.5 * 60 * 1000);
	}, 1 * 60 * 1000);
}

function clearPauseCounter () {
	clearTimeout(pauseCounter);
	heatingPaused = false;
	pauseCounter = null;
}

function updateHeatingStatus () {
	if (!initialized) {
		return Promise.resolve();
	}

	return targetTempService().then(target => {
		if (!isOn && !heatingPaused && avgValues.temperature <= target - 0.2) {
			turnHeatingOn();
			if (!pauseCounter) {
				initPauseCounter();
			}
		} else if (avgValues.temperature >= target + 0.2) {
			turnHeatingOff();
			clearPauseCounter();
		}
	}).catch((err) => {
		console.log("Error occured while fetching the heating plan for today", err);
	});
}
setInterval(updateHeatingStatus, 10000);
