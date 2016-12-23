const EventEmitter = require('events');
const evts = new EventEmitter();

const sensorData = {
	temperature: 0,
	humidity: 0
};

exports.set = (data) => {
	sensorData.temperature = data.temperature;
	sensorData.humidity = data.humidity;

	evts.emit('change', sensorData);
};

exports.get = () => {
	return sensorData;
};

exports.evts = evts;
