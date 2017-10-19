/* global $, Chart, moment */

'use strict';

const module = require('./module');

const SECURITY_STATUSES = {
	DISARMED: 'disarmed',
	ARMING: 'arming',
	ARMED: 'armed',
	PREACTIVATED: 'preactivated',
	ACTIVATED: 'activated'
};

const SECURITY_ARMED_STATUSES = [SECURITY_STATUSES.ARMED, SECURITY_STATUSES.PREACTIVATED, SECURITY_STATUSES.ACTIVATED];

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
	$scope.currentDate = d;

	$scope.targetTemp = getCurrentTemp($scope.todaysPlan.plan.ref);
};

module.controller('mainCtrl', ['$scope', '$http', 'socketio', 'loginStatus', 'passcode', function ($scope, $http, socketio, loginStatus, passcode) {
	loginStatus.check();

	let isMobileApp = false;
	if (navigator.userAgent.includes('wv')) {
		isMobileApp = true;
	}

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

	$scope.roomIdToLabel = {
		1: "Bedroom",
		2: "Kitchen"
	};

	const dayNameByIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];


	const handleServerData = function (data, initialData) {
		$scope.lastUpdate = new Date();

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

		if ((data.statisticsForLastMonth && data.statisticsForLastMonth.length && !isMobileApp) || initialData) {
			const minTargetTemp = Math.min(...data.statisticsForLastMonth.map(item => item.avgTargetTemp)).toFixed(1);
			const maxTargetTemp = Math.max(...data.statisticsForLastMonth.map(item => item.avgTargetTemp)).toFixed(1);

			const minAvgOutsideTemp = Math.min(...data.statisticsForLastMonth.map(item => item.avgOutsideTemp)).toFixed(1);
			const maxAvgOutsideTemp = Math.max(...data.statisticsForLastMonth.map(item => item.avgOutsideTemp)).toFixed(1);

			new Chart(document.querySelector('#statisticsLast30Days'), {
				type: 'line',
				options: {
					maintainAspectRatio: false,
					responsive: true
				},
				data: {
					datasets: [{
						label: 'Heating running time',
						yAxisID: "duration",
						data: [
							...data.statisticsForLastMonth.map(item => {return {x: item.date, y: item.runningMinutes}; })
						],
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
					}, {
						label: 'Avg target temperature',
						yAxisID: "temp",
						data: [
							...data.statisticsForLastMonth.map(item => {return {x: item.date, y: item.avgTargetTemp}; })
						],
						borderColor: "rgba(255,116,0,1)",
						borderCapStyle: 'butt',
						borderDash: [],
						borderDashOffset: 0.0,
						borderJoinStyle: 'miter',
						pointBorderColor: "rgba(255,116,0,1)",
						pointBackgroundColor: "#fff",
						pointBorderWidth: 1,
						pointHoverRadius: 6,
						pointHoverBackgroundColor: "rgba(255,116,0,1)",
						pointHoverBorderColor: "rgba(220,220,220,1)",
						pointHoverBorderWidth: 2,
						pointRadius: 3,
						pointHitRadius: 9,
						fill: false,
					}, {
						label: 'Avg outside temperature',
						yAxisID: "temp",
						data: [
							...data.statisticsForLastMonth.map(item => {return {x: item.date, y: item.avgOutsideTemp}; })
						],
						borderColor: "rgba(115,136,10,1)",
						borderCapStyle: 'butt',
						borderDash: [],
						borderDashOffset: 0.0,
						borderJoinStyle: 'miter',
						pointBorderColor: "rgba(115,136,10,1)",
						pointBackgroundColor: "#fff",
						pointBorderWidth: 1,
						pointHoverRadius: 6,
						pointHoverBackgroundColor: "rgba(115,136,10,1)",
						pointHoverBorderColor: "rgba(220,220,220,1)",
						pointHoverBorderWidth: 2,
						pointRadius: 3,
						pointHitRadius: 9,
						fill: false,
					}]
				},
				options: {
					scales: {
						xAxes: [{
							type: 'time',
							time: {
								unit: 'day',
								tooltipFormat: 'MMM Do',
								unitStepSize: 1,
								displayFormats: {
									millisecond: 'SSS [ms]',
									second: 'h:mm:ss a',
									minute: 'h:mm:ss a',
									hour: 'HH:mm',
									day: 'MMM D',
									week: 'll',
									month: 'MMM YYYY',
									quarter: '[Q]Q - YYYY',
									year: 'YYYY'
								}
							}
						}],
						yAxes: [{
							id: "duration",
							ticks: {
								callback: value => {
									let str = '';

									const duration = moment.duration(value * 60 * 1000);

									str += `${duration.hours() || 0}h `;
									str += `${duration.minutes() || 0}m`;

									return str.trim();
								},
								fixedStepSize: 30,
								min: 0
							},
							tooltipFormat: value => {
								let str = '';

								const duration = moment.duration(value * 60 * 1000);

								str += `${duration.hours() || 0}h `;
								str += `${duration.minutes() || 0}m`;

								return str.trim();
							}
						}, {
							id: "temp",
							ticks: {
								callback: value => value,
								fixedStepSize: 1,
								min: Math.floor(Math.min(minTargetTemp, minAvgOutsideTemp)),
								max: Math.ceil(Math.max(maxTargetTemp, maxAvgOutsideTemp))
							}
						}]
					}
				}
			});
		}


		if ((data.statisticsByMonth && data.statisticsByMonth.length && !isMobileApp) || initialData) {
			const minTargetTemp = Math.min(...data.statisticsByMonth.map(item => item.avgTargetTemp)).toFixed(1);
			const maxTargetTemp = Math.max(...data.statisticsByMonth.map(item => item.avgTargetTemp)).toFixed(1);

			const minAvgOutsideTemp = Math.min(...data.statisticsByMonth.map(item => item.avgOutsideTemp)).toFixed(1);
			const maxAvgOutsideTemp = Math.max(...data.statisticsByMonth.map(item => item.avgOutsideTemp)).toFixed(1);

			new Chart(document.querySelector('#statisticsByMonth'), {
				type: 'line',
				options: {
					maintainAspectRatio: false,
					responsive: true
				},
				data: {
					datasets: [{
						label: 'Avg heating running time',
						yAxisID: "duration",
						data: [
							...data.statisticsByMonth.map(item => {return {x: item.date, y: item.avgRunningMinutes}; })
						],
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
					}, {
						label: 'Avg target temperature',
						yAxisID: "temp",
						data: [
							...data.statisticsByMonth.map(item => {return {x: item.date, y: item.avgTargetTemp}; })
						],
						borderColor: "rgba(255,116,0,1)",
						borderCapStyle: 'butt',
						borderDash: [],
						borderDashOffset: 0.0,
						borderJoinStyle: 'miter',
						pointBorderColor: "rgba(255,116,0,1)",
						pointBackgroundColor: "#fff",
						pointBorderWidth: 1,
						pointHoverRadius: 6,
						pointHoverBackgroundColor: "rgba(255,116,0,1)",
						pointHoverBorderColor: "rgba(220,220,220,1)",
						pointHoverBorderWidth: 2,
						pointRadius: 3,
						pointHitRadius: 9,
						fill: false,
					}, {
						label: 'Avg outside temperature',
						yAxisID: "temp",
						data: [
							...data.statisticsByMonth.map(item => {return {x: item.date, y: item.avgOutsideTemp}; })
						],
						borderColor: "rgba(115,136,10,1)",
						borderCapStyle: 'butt',
						borderDash: [],
						borderDashOffset: 0.0,
						borderJoinStyle: 'miter',
						pointBorderColor: "rgba(115,136,10,1)",
						pointBackgroundColor: "#fff",
						pointBorderWidth: 1,
						pointHoverRadius: 6,
						pointHoverBackgroundColor: "rgba(115,136,10,1)",
						pointHoverBorderColor: "rgba(220,220,220,1)",
						pointHoverBorderWidth: 2,
						pointRadius: 3,
						pointHitRadius: 9,
						fill: false,
					}]
				},
				options: {
					scales: {
						xAxes: [{
							type: 'time',
							time: {
								unit: 'month',
								tooltipFormat: 'YYYY MMM',
								unitStepSize: 1,
								displayFormats: {
									millisecond: 'SSS [ms]',
									second: 'h:mm:ss a',
									minute: 'h:mm:ss a',
									hour: 'HH:mm',
									day: 'MMM D',
									week: 'll',
									month: 'MMM YYYY',
									quarter: '[Q]Q - YYYY',
									year: 'YYYY'
								}
							}
						}],
						yAxes: [{
							id: "duration",
							ticks: {
								callback: value => {
									let str = '';

									const duration = moment.duration(value * 60 * 1000);

									str += `${duration.hours() || 0}h `;
									str += `${duration.minutes() || 0}m`;

									return str.trim();
								},
								fixedStepSize: 30,
								min: 0
							},
							tooltipFormat: value => {
								let str = '';

								const duration = moment.duration(value * 60 * 1000);

								str += `${duration.hours() || 0}h `;
								str += `${duration.minutes() || 0}m`;

								return str.trim();
							}
						}, {
							id: "temp",
							ticks: {
								callback: value => value,
								fixedStepSize: 2,
								min: Math.floor(Math.min(minTargetTemp, minAvgOutsideTemp)),
								max: Math.ceil(Math.max(maxTargetTemp, maxAvgOutsideTemp))
							},
							tooltipFormat: value => value.toFixed(1)
						}]
					}
				}
			});
		}


		if ((data.heatingHistoryLast24 && data.heatingHistoryLast24.length && !isMobileApp) || initialData) {
			new Chart(document.querySelector('#heatingHistoryChart'), {
				type: 'line',
				options: {
					maintainAspectRatio: false,
					responsive: true
				},
				data: {
					datasets: [{
						label: 'Heating status',
						data: [
							{
								x: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
								y: data.heatingHistoryLast24.length ? (data.heatingHistoryLast24[0].status ? 0 : 10) : 0
							},
							...data.heatingHistoryLast24.map(item => {return {x: item.datetime, y: item.status ? 10 : 0}; }),
							{
								x: new Date(),
								y: $scope.isHeatingOn ? 10 : 0
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
									day: 'MMM D',
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
									return value === 0 ? 'Off' : value === 10 ? 'On' : '';
								},
								fixedStepSize: 1,
								min: 0,
								max: 10
							}
						}]
					}
				}
			});
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

				handleServerData(data, true);

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
