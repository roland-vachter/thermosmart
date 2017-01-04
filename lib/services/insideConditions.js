const EventEmitter = require('events');
const evts = new EventEmitter();

const sensorData = {};

exports.set = (data) => {
	if (!sensorData[data.id]) {
		sensorData[data.id] = {};
	}

	sensorData[data.id].temperature = data.temperature;
	sensorData[data.id].humidity = data.humidity;

	sensorData[data.id].lastUpdate = new Date();

	evts.emit('change', sensorData);
};

exports.get = () => {
	return sensorData;
};

exports.evts = evts;
