/* global angular */

'use strict';

const module = require('./module');

function pad(num, size) {
	let s = num+"";
	while (s.length < size) s = "0" + s;
	return s;
}

const getPercentInDay = function (hour, minute) {
	if (hour === undefined || minute === undefined) {
		const now = new Date();
		hour = now.getHours();
		minute = now.getMinutes();
	}

	const percentInDay = (hour * 60 + minute) * 100 / 1440;

	return percentInDay;
};

const processPlanForDisplay = function (heatingPlan) {
	let lastPercent = 0;

	heatingPlan.intervals.forEach((interval, index) => {
		if (index === 0) {
			interval.label = '00:00';
			interval.labelPosition = 0;
			interval.blockPosition = 0;
		} else {
			const percentInDay = getPercentInDay(interval.startHour, interval.startMinute);

			interval.label = `${pad(interval.startHour, 2)}:${pad(interval.startMinute, 2)}`;
			interval.labelPosition = percentInDay;

			heatingPlan.intervals[index - 1].blockPosition = percentInDay - lastPercent;

			lastPercent = percentInDay;
		}
	});

	if (heatingPlan.intervals.length) {
		heatingPlan.intervals[heatingPlan.intervals.length - 1].blockPosition = 100 - lastPercent;
	}
};

const getCurrentTemp = function (todaysPlan) {
	let temp = null;
	const today = new Date();

	todaysPlan.intervals.forEach(interval => {
		if (today.getHours() >= interval.startHour &&
				today.getMinutes() >= interval.startMinute) {
			temp = interval.temp;
		}
	});

	return temp;
};

const updateView = function ($scope) {
	const d = new Date();
	$scope.percentInDay = getPercentInDay();
	$scope.currentTime = `${pad(d.getHours(), 2)}:${pad(d.getMinutes(), 2)}`;

	$scope.targetTemp = getCurrentTemp($scope.todaysPlan);
};

module.controller('mainCtrl', ['$scope', '$http', 'socketio', 'loginStatus', function ($scope, $http, socketio, loginStatus) {
	loginStatus.check();

	$scope.targetTemp = 0;

	$scope.insideTemp = 22.3;
	$scope.insideHumi = 55.4;
	$scope.outsideTemp = 0;
	$scope.outsideHumi = 0;

	$scope.temps = {};
	$scope.heatingPlans = {};
	$scope.heatingDefaultPlans = {};
	$scope.todaysPlan = {};
	$scope.heatingOn = true;



	$http.get('/api/init').then((response) => {
		if (response.data && response.data.data) {
			const data = response.data.data;

			$scope.outsideTemp = data.outside.temperature;
			$scope.outsideHumi = data.outside.humidity;

			data.temperatures.forEach(temp => {
				$scope.temps[temp._id] = temp;
			});

			data.heatingPlans.forEach(heatingPlan => {
				$scope.heatingPlans[heatingPlan._id] = heatingPlan;
				heatingPlan.intervals.forEach(override => {
					override.temp = $scope.temps[override.temp];
				});

				processPlanForDisplay(heatingPlan);
			});

			data.heatingDefaultPlans.forEach(heatingPlan => {
				$scope.heatingDefaultPlans[heatingPlan.dayOfWeek] = heatingPlan;
				heatingPlan.plan = $scope.heatingPlans[heatingPlan.plan];
			});

			$scope.todaysPlan = $scope.heatingDefaultPlans[new Date().getDay()].plan;

			updateView($scope);
			setInterval(() => {
				updateView($scope);
			}, 60000);
		}
	}, (err) => {
		console.log(err);
	});

	socketio.on('update', (data) => {
		if (data.outside) {
			$scope.outsideTemp = data.outside.temperature;
			$scope.outsideHumi = data.outside.humidity;
		}
	});

	$scope.tempAdjust = function (id, value) {
		$scope.temps[id].value += value;
		$scope.temps[id].value = parseFloat($scope.temps[id].value.toFixed(1));

		/*$http.get('/api/tempadjust', {
			_id: id,
			value: $scope.temps[id].value
		});*/
	}

	$scope.scope = function () {
		return $scope;
	}
}]);
