/* global moment */

'use strict';

const module = require('./module');

module.filter('float', ['$sce', function($sce) {
	return function(value) {
		let transformedValue = '';

		if (value >= 0) {
			transformedValue += Math.floor(value);
		} else {
			transformedValue += Math.ceil(value);
		}

		let decimal = Math.abs(value) % 1;

		if (decimal && decimal.toFixed(1) === '1.0') {
			decimal = 0;

			if (value >= 0) {
				transformedValue = Math.floor(value) + 1;
			} else {
				transformedValue = Math.ceil(value) - 1;
			}
		}
		transformedValue += `<span class="decimal">${decimal ? decimal.toFixed(1).substr(1) : '.0'}</span>`;

		return $sce.trustAsHtml(transformedValue);
	};
}]);

module.filter('first2chars', () => (value => value ? value.substr(0, 2) : ''));

module.filter('duration', () => (value => {
	let str = '';

	const duration = moment.duration(value * 60 * 1000);

	str += `${duration.hours() || 0}h `;
	str += `${duration.minutes() || 0}m`;

	return str.trim();
}));
