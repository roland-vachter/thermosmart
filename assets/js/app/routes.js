/* global angular */

'use strict';

const module = require('./module');
require('./controllers');

module.config(['$routeProvider', function ($routeProvider) {
	$routeProvider.when('/', {
		templateUrl: '/views/index.html',
		controller: 'mainCtrl',
	});
}]);