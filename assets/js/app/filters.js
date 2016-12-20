/* global angular */

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

		const decimal = Math.abs(value) % 1;
		if (decimal) {
			transformedValue += `<span class="decimal">${decimal.toFixed(1).substr(1)}</span>`;
		}

		return $sce.trustAsHtml(transformedValue);
	};
}]);
