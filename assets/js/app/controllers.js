/* global $, Chart */

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
	$scope.percentInDay = getPercentInDay();
	$scope.currentTime = `${pad(d.getHours(), 2)}:${pad(d.getMinutes(), 2)}`;

	$scope.targetTemp = getCurrentTemp($scope.todaysPlan.plan.ref);
};

module.controller('mainCtrl', ['$scope', '$http', 'socketio', 'loginStatus', function ($scope, $http, socketio, loginStatus) {
	loginStatus.check();

	$scope.targetTemp = 0;

	$scope.inside = {
		temp: NaN,
		humi: NaN
	};

	$scope.outside = {
		temp: NaN,
		humi: NaN,
		weatherIconClass: ''
	};

	$scope.temps = {};
	$scope.heatingPlans = {};
	$scope.heatingDefaultPlans = {};
	$scope.todaysPlan = {};
	$scope.isHeatingOn = false;
	$scope.init = false;

	$scope.roomIdToLabel = {
		1: "Bedroom",
		2: "Kitchen"
	};

	const dayNameByIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];


	const handleServerData = function (data) {
		if (data.outside) {
			$scope.outside.temp = data.outside.temperature;
			$scope.outside.humi = data.outside.humidity;
			$scope.outside.weatherIconClass = data.outside.weatherIconClass;
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

				$scope.heatingPlans[heatingPlan._id].ref = heatingPlan;

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

				$scope.heatingDefaultPlans[heatingPlan.dayOfWeek] = heatingPlan;

				heatingPlan.plan = $scope.heatingPlans[heatingPlan.plan];
				heatingPlan.nameOfDay = dayNameByIndex[heatingPlan.dayOfWeek];
			});
		}

		if (data.heatingHistoryLast24) {
			new Chart(document.querySelector('#heatingHistoryChart'), {
				type: 'line',
				maintainAspectRatio: false,
				data: {
					datasets: [{
						label: 'Heating status',
						data: [
							{
								x: data.heatingHistoryLast24[0].datetime,
								y: !data.heatingHistoryLast24[0].status
							},
							...data.heatingHistoryLast24.map(item => {return {x: item.datetime, y: item.status}; }),
							{
								x: new Date(),
								y: $scope.isHeatingOn
							}
						],
						steppedLine: true,
						backgroundColor: "rgba(75,192,192,0.4)",
						borderColor: "rgba(75,192,192,1)",
						borderCapStyle: 'butt',
						borderDash: [],
						borderDashOffset: 0.0,
						borderJoinStyle: 'miter',
						pointBorderColor: "rgba(75,192,192,1)",
						pointBackgroundColor: "#fff",
						pointBorderWidth: 1,
						pointHoverRadius: 6,
						pointHoverBackgroundColor: "rgba(75,192,192,1)",
						pointHoverBorderColor: "rgba(220,220,220,1)",
						pointHoverBorderWidth: 2,
						pointRadius: 3,
						pointHitRadius: 9,
					}]
				},
				options: {
					scales: {
						xAxes: [{
							type: 'time',
							time: {
								unit: 'hour',
								tooltipFormat: 'MMM Do, HH:mm',
								unitStepSize: 1,
								displayFormats: {
									millisecond: 'SSS [ms]',
									second: 'h:mm:ss a',
									minute: 'h:mm:ss a',
									hour: 'HH:mm',
									day: 'll',
									week: 'll',
									month: 'MMM YYYY',
									quarter: '[Q]Q - YYYY',
									year: 'YYYY'
								}
							}
						}],
						yAxes: [{
							ticks: {
								callback: function(value) {
									return value ? 'On' : 'Off';
								},
								fixedStepSize: 1,
								min: 0,
								max: 1
							}
						}]
					}
				}
			});
		}

		$scope.todaysPlan = $scope.heatingDefaultPlans[new Date().getDay()];
		updateView($scope);
	};

	const init = function () {
		$http.get(`/api/init?_=${new Date().getTime()}`).then((response) => {
			console.log(response);

			if (response.data && response.data.data) {
				const data = response.data.data;

				handleServerData(data);

				$scope.todaysPlan = $scope.heatingDefaultPlans[new Date().getDay()];

				updateView($scope);
				setInterval(() => {
					updateView($scope);
				}, 60000);

				$scope.init = true;


				$(".responsive-calendar").responsiveCalendar({
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
				});
			}
		}, (err) => {
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

	init();
}]);
