"use strict";

const EventEmitter = require('events');
const evts = new EventEmitter();

const fetch = require('node-fetch');

let lastValues = {
	temperature: NaN,
	humidity: NaN
};

function update () {
	fetch("https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22Cluj-Napoca%22)%20and%20u%3D'c'&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys").then(res => {
		if (!res.ok) {
			const err = new Error(res.status);
			err.response = res;
			throw err;
		}

		return res.json();
	}).then(json => {
		if (json && json.query && json.query.results && json.query.results.channel) {
			let temperature = parseInt(json.query.results.channel.item.condition.temp, 10);
			let humidity = parseInt(json.query.results.channel.atmosphere.humidity, 10);

			if (lastValues.temperature !== temperature || lastValues.humidity !== humidity) {
				lastValues.temperature = temperature;
				lastValues.humidity = humidity;

				evts.emit('change', lastValues);
			}
		}
	}).catch((err) => {
		console.log(err);
	});
}
setInterval(() => {
	update();
}, 60 * 1000);
update();

exports.get = function () {
	return lastValues;
};

exports.evts = evts;
