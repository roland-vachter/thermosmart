const EventEmitter = require('events');
const evts = new EventEmitter();

let sensorData = {};

exports.set = (data) => {
	if (!sensorData[data.id]) {
		sensorData[data.id] = {};
	}

	let changesMade = false;

	if (sensorData[data.id].temperature !== data.temperature ||
			sensorData[data.id].humidity !== data.humidity ||
			sensorData[data.id].active !== true) {
		changesMade = true;
	}

	sensorData[data.id].temperature = data.temperature;
	sensorData[data.id].humidity = data.humidity;

	sensorData[data.id].lastUpdate = new Date();
	sensorData[data.id].active = true;

	if (changesMade) {
		evts.emit('change', sensorData);
	}
};

exports.get = () => {
	return sensorData;
};


setInterval(() => {
	let changesMade = false;
	Object.keys(sensorData).forEach(id => {
		if (new Date().getTime() - sensorData[id].lastUpdate.getTime() > 5 * 60 * 1000) {
			sensorData[id].active = false;

			changesMade = true;
		}

		if (new Date().getTime() - sensorData[id].lastUpdate.getTime() > 10 * 60 * 1000) {
			if (sensorData.length === 1) {
				sensorData = [];
			} else {
				delete sensorData[id];
			}

			changesMade = true;
		}
	});

	if (changesMade) {
		evts.emit('change', sensorData);
	}
}, 10 * 1000);

exports.evts = evts;
