const SensorSetting = require('../models/SensorSetting');

const EventEmitter = require('events');
const evts = new EventEmitter();

let sensorData = {};

exports.set = async (data) => {
	try {
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

		let sensorSetting = await SensorSetting.findOne({
			_id: data.id
		});

		if (!sensorSetting) {
			sensorSetting = new SensorSetting({
				_id: data.id,
				order: data.id,
				label: data.id,
				enabled: true
			});
			await sensorSetting.save();
		}

		sensorData[data.id].enabled = sensorSetting.enabled;
		sensorData[data.id].label = sensorSetting.label;

		if (changesMade) {
			evts.emit('change', sensorData);
		}
	} catch (e) {
		console.error("Error saving sensor data", e);
	}
};

exports.get = () => {
	return sensorData;
};

exports.toggleSensorStatus = async (id) => {
	let sensorSetting = await SensorSetting.findOne({
		_id: id
	});

	if (sensorSetting) {
		sensorSetting.enabled = !sensorSetting.enabled;
		sensorData[id].enabled = sensorSetting.enabled;
		await sensorSetting.save();

		evts.emit('change', sensorData);

		return true;
	}

	return false;
};

exports.changeSensorLabel = async (id, label) => {
	let sensorSetting = await SensorSetting.findOne({
		_id: id
	});

	if (sensorSetting) {
		sensorSetting.label = label;
		sensorData[id].label = sensorSetting.label;
		await sensorSetting.save();

		evts.emit('change', sensorData);

		return true;
	}

	return false;
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
