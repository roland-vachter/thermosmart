"use strict";

const EventEmitter = require('events');
const evts = new EventEmitter();

const backgroundImage = require('./backgroundImage');
const fetch = require('node-fetch');

const lastValues = {
	temperature: NaN,
	humidity: NaN,
	weatherIconClass: '',
	weatherDescription: ''
};


const iconClassMapping = {
	clear: 'icon-sun2',
	cloudy: 'icon-cloudy2',
	flurries: 'icon-rain-73',
	fog: 'icon-haze',
	hazy: 'icon-haze-1',
	mostlycloudy: 'icon-cloud2',
	mostlysunny: 'icon-cloudy-1',
	partlycloudy: 'icon-cloud-12',
	partlysunny: 'icon-sun-2',
	sleet: 'icon-rain-73',
	rain: 'icon-rain2',
	snow: 'icon-snowing',
	sunny: 'icon-sun2',
	tstorms: 'icon-storm2',

	nt_clear: 'icon-night-12',
	nt_cloudy: 'icon-cloudy2',
	nt_flurries: 'icon-rain-73',
	nt_fog: 'icon-haze',
	nt_hazy: 'icon-moon-42',
	nt_mostlycloudy: 'icon-cloud-12',
	nt_mostlysunny: 'icon-night-22',
	nt_partlycloudy: 'icon-night3',
	nt_partlysunny: 'icon-night3',
	nt_sleet: 'icon-rain-73',
	nt_rain: 'icon-rainy',
	nt_snow: 'icon-snowing',
	nt_sunny: 'icon-night-12',
	nt_tstorms: 'icon-storm2'
};


async function update () {
	try {
		let res = await fetch(`http://api.wunderground.com/api/${process.env.WEATHER_API_KEY}/conditions/pws:0/q/RO/Cluj-napoca.json`);

		if (!res.ok) {
			res = await fetch(`http://api.wunderground.com/api/${process.env.WEATHER_API_KEY}/conditions/q/RO/pws:ICLUJNAP7.json`);
		}

		if (!res.ok) {
			res = await fetch(`http://api.wunderground.com/api/${process.env.WEATHER_API_KEY}/conditions/q/RO/Cluj-napoca.json`);
		}

		if (!res.ok) {
			const err = new Error(res.status);
			err.response = res;
			throw err;
		}

		const json = await res.json();

		if (json && json.current_observation) {
			const temperature = json.current_observation.temp_c;
			const humidity = parseInt(json.current_observation.relative_humidity.replace('%', ''), 10);
			const weatherDescription = json.current_observation.icon_url.match(/\/([^\/]+)\.gif/)[1];

			if (lastValues.temperature !== temperature
					|| lastValues.humidity !== humidity
					|| lastValues.weatherDescription !== weatherDescription) {
				lastValues.temperature = temperature;
				lastValues.humidity = humidity;
				lastValues.weatherDescription = weatherDescription;
				lastValues.weatherIconClass = iconClassMapping[weatherDescription];
				lastValues.backgroundImage = backgroundImage.get(weatherDescription);

				evts.emit('change', lastValues);
			}
		}
	} catch (e) {
		console.log(e);
	};
}
setInterval(() => {
	update();
}, 5 * 60 * 1000);
update();

exports.get = function () {
	return lastValues;
};

exports.evts = evts;
