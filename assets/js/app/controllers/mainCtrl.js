/* global $ */

'use strict';

const module = require('../module');
const helpers = require('../helpers');

const SECURITY_STATUSES = {
	DISARMED: 'disarmed',
	ARMING: 'arming',
	ARMED: 'armed',
	PREACTIVATED: 'preactivated',
	ACTIVATED: 'activated'
};

const SECURITY_ARMED_STATUSES = [SECURITY_STATUSES.ARMED, SECURITY_STATUSES.PREACTIVATED, SECURITY_STATUSES.ACTIVATED];

const processPlanForDisplay = function (heatingPlan) {
	let lastPercent = 0;

	heatingPlan.intervals.forEach((interval, index) => {
		if (index === 0) {
			interval.label = '';
			interval.labelPosition = 0;
			interval.blockPosition = 0;
		} else {
			const percentInDay = helpers.getPercentInDay(interval.startHour, interval.startMinute);

			interval.label = `${helpers.pad(interval.startHour, 2)}:${helpers.pad(interval.startMinute, 2)}`;
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
		if (today.getHours() > interval.startHour ||
				(today.getHours() === interval.startHour &&
				today.getMinutes() >= interval.startMinute)) {
			temp = interval.temp;
		}
	});

	return temp;
};


const updateView = function ($scope) {
	const d = new Date();
	$scope.percentInDay = helpers.getPercentInDay();
	$scope.currentTime = `${helpers.pad(d.getHours(), 2)}:${helpers.pad(d.getMinutes(), 2)}`;
	$scope.currentDate = d;

	$scope.targetTemp = getCurrentTemp($scope.todaysPlan.plan.ref);
};

module.controller('mainCtrl', ['$scope', '$http', '$uibModal', 'socketio', 'loginStatus', 'passcode', function ($scope, $http, $uibModal, socketio, loginStatus, passcode) {
	loginStatus.check();

	$scope.lastUpdate = null;

	$scope.security = SECURITY_STATUSES.DISARMED;

	$scope.SECURITY_STATUSES = SECURITY_STATUSES;
	$scope.SECURITY_ARMED_STATUSES = SECURITY_ARMED_STATUSES;

	$scope.targetTemp = 0;

	$scope.inside = {
		temp: 0,
		humi: 0
	};

	$scope.outside = {
		temp: 0,
		humi: 0,
		weatherIconClass: ''
	};

	$scope.temps = {};
	$scope.heatingPlans = {};
	$scope.heatingDefaultPlans = {};
	$scope.todaysPlan = {};
	$scope.isHeatingOn = false;
	$scope.init = false;
	$scope.statisticsForToday = {
		heatingDuration: 0
	};

	$scope.initInProgress = false;
	$scope.restartSensorInProgress = false;

	$scope.roomIdToLabel = {
		1: 'Entrance',
		2: 'Small bedroom',
		3: 'Living',
		4: 'Large bedroom'
	};

	const dayNameByIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

	$scope.statisticsModalOpen = () => {
		$uibModal.open({
			templateUrl: 'views/statistics-modal.html',
			controller: 'modalStatisticsCtrl',
			size: 'lg'
		}).result.then(() => {}, () => {});
	};


	const handleServerData = function (data) {
		$scope.lastUpdate = new Date();

		if (typeof data.restartSensorInProgress === 'boolean') {
			$scope.restartSensorInProgress = data.restartSensorInProgress;
		}

		if (data.outside) {
			$scope.outside.temp = data.outside.temperature;
			$scope.outside.humi = data.outside.humidity;
			$scope.outside.weatherIconClass = data.outside.weatherIconClass;

			if (data.outside.backgroundImage) {
				document.body.backgroundImage = document.body.style.backgroundImage.substring(0, document.body.style.backgroundImage.lastIndexOf('/') + 1) + data.outside.backgroundImage;
			}
		}

		if (data.inside) {
			const ids = Object.keys(data.inside);

			$scope.inside.temp = 0;
			$scope.inside.humi = 0;

			let activeCount = 0;
			ids.forEach(id => {
				if (data.inside[id].active) {
					$scope.inside.temp += data.inside[id].temperature;
					$scope.inside.humi += data.inside[id].humidity;

					activeCount++;
				}
			});

			$scope.inside.temp = $scope.inside.temp / activeCount;
			$scope.inside.humi = Math.round($scope.inside.humi / activeCount);


			$scope.inside.individual = data.inside;
		}

		if (typeof data.isHeatingOn === 'boolean') {
			$scope.isHeatingOn = data.isHeatingOn;
		}

		if (data.temperatures) {
			data.temperatures.forEach(temp => {
				if (!$scope.temps[temp._id]) {
					$scope.temps[temp._id] = {};
				}

				$scope.temps[temp._id].ref = temp;
			});
		}

		if (data.heatingPlans) {
			data.heatingPlans.forEach(heatingPlan => {
				if (!$scope.heatingPlans[heatingPlan._id]) {
					$scope.heatingPlans[heatingPlan._id] = {};
				}

				$scope.heatingPlans[heatingPlan._id].ref = Object.assign({}, heatingPlan);

				heatingPlan.intervals.forEach(override => {
					override.temp = $scope.temps[override.temp];
				});

				processPlanForDisplay(heatingPlan);
			});
		}

		if (data.heatingDefaultPlans) {
			data.heatingDefaultPlans.forEach(heatingPlan => {
				if (!$scope.heatingDefaultPlans[heatingPlan.dayOfWeek]) {
					$scope.heatingDefaultPlans[heatingPlan.dayOfWeek] = {};
				}

				$scope.heatingDefaultPlans[heatingPlan.dayOfWeek] = Object.assign({}, heatingPlan);

				$scope.heatingDefaultPlans[heatingPlan.dayOfWeek].plan = $scope.heatingPlans[heatingPlan.plan];
				$scope.heatingDefaultPlans[heatingPlan.dayOfWeek].nameOfDay = dayNameByIndex[heatingPlan.dayOfWeek];
			});
		}

		if (data.statisticsForToday) {
			$scope.statisticsForToday = data.statisticsForToday;
		}

		if (data.security) {
			$scope.security = data.security.status;
		}

		$scope.todaysPlan = $scope.heatingDefaultPlans[new Date().getDay()];
		updateView($scope);
	};

	const init = function () {
		$scope.initInProgress = true;

		$http.get(`/api/init?_=${new Date().getTime()}`).then((response) => {
			if (response.data && response.data.data) {
				const data = response.data.data;

				handleServerData(data);

				$scope.todaysPlan = $scope.heatingDefaultPlans[new Date().getDay()];

				updateView($scope);

				if (!$scope.init) {
					setInterval(() => {
						updateView($scope);
					}, 60000);
				}

				$scope.init = true;


				/*$(".responsive-calendar").responsiveCalendar({
					time: '2016-12',
					events: {
						"2016-12-30": {
							"number": 5,
							"url": "http://w3widgets.com/responsive-slider"
						},
						"2016-12-26": {
							"number": 1,
							"url": "http://w3widgets.com"
						},
						"2016-12-03": {
							number: ' ',
							badgeClass: "icon-work"
						},
						"2016-12-12": {}
					}
				});*/
			}

			$scope.initInProgress = false;
		}, (err) => {
			$scope.initInProgress = false;
			console.log(err);
		});
	};

	socketio.on('update', handleServerData);

	$scope.tempAdjust = function (id, value) {
		$scope.temps[id].ref.value += value;
		$scope.temps[id].ref.value = parseFloat($scope.temps[id].ref.value.toFixed(1));

		$http.post('/api/tempadjust', {
			_id: id,
			value: $scope.temps[id].ref.value
		});
	};

	$scope.restartSensor = function () {
		$http.post('/api/restartsensor');
	};

	$scope.securityToggleAlarm = function () {
		passcode.check().then(result => {
			if (result.status === 'valid') {
				$http.post('/api/securitytogglealarm');

				switch ($scope.security) {
					case SECURITY_STATUSES.DISARMED:
						$scope.security = SECURITY_STATUSES.ARMING;
						break;

					case SECURITY_STATUSES.ARMING:
						$scope.security = SECURITY_STATUSES.DISARMED;
						break;

					default:
						$scope.security = SECURITY_STATUSES.DISARMED;
						break;
				}
			}
		});
	};


	let selectedDayOfWeekToChange = null;
	const selectPlanModal = $('.thermo-select-plan--modal');
	selectPlanModal.on('show.bs.modal', (e) => {
		const srcEl = e.relatedTarget;

		if (srcEl.getAttribute('data-default-week-plan')) {
			selectedDayOfWeekToChange = srcEl.getAttribute('data-default-week-plan');
		}
	});
	selectPlanModal.on('hide.bs.modal', () => {
		selectedDayOfWeekToChange = null;
	});

	$scope.selectPlan = function (planId) {
		if (selectedDayOfWeekToChange) {
			$http.post('/api/changedefaultplan', {
				dayOfWeek: selectedDayOfWeekToChange,
				planId: planId
			});

			selectPlanModal.modal('hide');
		}
	};

	$scope.scope = function () {
		return $scope;
	};

	$scope.refresh = function () {
		init();
	};

	init();
}]);
