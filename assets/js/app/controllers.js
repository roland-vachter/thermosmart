/* global angular */

'use strict';

const module = require('./module');

const getPercentInDay = function () {
	const now = new Date();
	const percentInDay = (now.getHours() * 60 + now.getMinutes()) * 100 / 1440;

	return percentInDay;
};

module.controller('mainCtrl', ['$scope', '$http', 'socketio', 'loginStatus', function ($scope, $http, socketio, loginStatus) {
	loginStatus.check();

	$scope.target = 22.1;

	$scope.insideTemp = 22.3;
	$scope.insideHumi = 55.4;
	$scope.outsideTemp = 0;
	$scope.outsideHumi = 0;

	$scope.temps = [];

	$http.get('/api/init').then((response) => {
		if (response.data) {
			console.log(response.data);

			$scope.outsideTemp = response.data.outside.temperature;
			$scope.outsideHumi = response.data.outside.humidity;

			$scope.temps = response.data.temperatures;
		}
	}, (err) => {
		console.log(err);
	});

	$scope.percentInDay = getPercentInDay();
	setInterval(getPercentInDay, 60000);

	socketio.on('update', (data) => {
		if (data.outside) {
			$scope.outsideTemp = data.outside.temperature;
			$scope.outsideHumi = data.outside.humidity;
		}
	});
}]);
