"use strict";

const EventEmitter = require('events');
const evts = new EventEmitter();

const fetch = require('node-fetch');

const lastValues = {
	temperature: NaN,
	humidity: NaN,
	weatherIconUrl: ''
};

function update () {
	fetch(`http://api.wunderground.com/api/${process.env.WEATHER_API_KEY}/conditions/q/RO/Cluj-napoca.json`).then(res => {
		if (!res.ok) {
			const err = new Error(res.status);
			err.response = res;
			throw err;
		}

		return res.json();
	}).then(json => {
		if (json && json.current_observation) {
			const temperature = json.current_observation.temp_c;
			const humidity = parseInt(json.current_observation.relative_humidity.replace('%', ''), 10);
			const weatherIconUrl = json.current_observation.icon_url;

			if (lastValues.temperature !== temperature
					|| lastValues.humidity !== humidity
					|| lastValues.weatherIconUrl !== weatherIconUrl) {
				lastValues.temperature = temperature;
				lastValues.humidity = humidity;
				lastValues.weatherIconUrl = weatherIconUrl;

				evts.emit('change', lastValues);
			}
		}
	}).catch((err) => {
		console.log(err);
	});
}
setInterval(() => {
	update();
}, 5 * 60 * 1000);
update();

exports.get = function () {
	return lastValues;
};

exports.evts = evts;
