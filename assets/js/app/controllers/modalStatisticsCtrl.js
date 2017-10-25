/* global Chart, moment */

'use strict';

const module = require('../module');

module.controller('modalStatisticsCtrl', ['$scope', '$http', 'loginStatus', function ($scope, $http, loginStatus) {
	loginStatus.check();

	$scope.initInProgress = false;

	const handleServerData = function (data) {
		if (data.statisticsForLastMonth && data.statisticsForLastMonth.length) {
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


		if (data.statisticsByMonth && data.statisticsByMonth.length) {
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


		if (data.statisticsForToday && data.statisticsForToday.length) {
			new Chart(document.querySelector('#heatingHistoryChart'), {
				type: 'line',
				options: {
					maintainAspectRatio: false,
					responsive: true
				},
				data: {
					datasets: [{
						label: 'Heating status',
						data: data.statisticsForToday.map(item => {return {x: item.datetime, y: item.status ? 10 : 0}; }),
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
	};

	const init = function () {
		$scope.initInProgress = true;

		$http.get(`/api/statistics?_=${new Date().getTime()}`).then((response) => {
			if (response.data && response.data.data) {
				const data = response.data.data;

				handleServerData(data, true);
			}
		}, (err) => {
			console.log(err);
		});
	};

	init();
}]);
