"use strict";

require('./js/assets');

require('./js/app/module');
require('./js/app/services');
require('./js/app/controllers');
require('./js/app/routes');
require('./js/app/filters');

require('bootstrap-sass');

/*const Bind = require('bind.js');

const floatValueTransform = function (value) {
	let transformedValue = '';

	if (value >= 0) {
		transformedValue += Math.floor(value);
	} else {
		transformedValue += Math.ceil(value);
	}

	const decimal = Math.abs(value) % 1;
	if (decimal) {
		transformedValue += `<span class="decimal">${decimal.toFixed(1).substr(1)}</span>`;
	}

	return transformedValue;
};

const updatePercentInDay = function (element) {
	const now = new Date();
	const percentInDay = (now.getHours() * 60 + now.getMinutes()) * 100 / 1440;

	element.style.top = percentInDay + '%';
};

document.addEventListener('DOMContentLoaded', () => {
	const data = new Bind({
		insideTemp: 22.3,
		insideHumi: 55.4,
		outsideTemp: -4.7,
		outsideHumi: 79.2,
		target: 22.1
	}, {
		insideTemp: {
			dom: '.inside-temp',
			transform: floatValueTransform
		},
		insideHumi: {
			dom: '.inside-humi',
			transform: floatValueTransform
		},
		outsideTemp: {
			dom: '.outside-temp',
			transform: floatValueTransform
		},
		outsideHumi: {
			dom: '.outside-humi',
			transform: floatValueTransform
		},
		target: {
			dom: '.target',
			transform: floatValueTransform
		}
	});

	const pointerIcon = document.querySelector('.thermo-plan--pointer i');

	setInterval(() => {
		updatePercentInDay(pointerIcon);
	}, 60 * 1000);
	updatePercentInDay(pointerIcon);


	const targetDecreaseButton = document.querySelector('.thermo-target--decrease');
	const targetIncreaseButton = document.querySelector('.thermo-target--increase');

	targetIncrease
});
*/