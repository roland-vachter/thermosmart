const OutsideConditionHistory = require('../models/OutsideConditionHistory');
const outsideConditions = require('./outsideConditions');

const HeatingHistory = require('../models/HeatingHistory');
const heatingService = require('./heating.js');

const TargetTempHistory = require('../models/TargetTempHistory');
const targetTempService = require('./targetTemp');

const HeatingStatistics = require('../models/HeatingStatistics');

const moment = require('moment-timezone');


outsideConditions.evts.on('change', values => {
	if (values && !isNaN(values.temperature) && !isNaN(values.humidity)) {
		new OutsideConditionHistory({
			datetime: new Date(),
			t: values.temperature,
			h: values.humidity
		}).save();
	}
});

heatingService.evts.on('change', status => {
	HeatingHistory
		.findOne()
		.sort({
			datetime: -1
		})
		.exec()
		.then((result) => {
			if (!result || result.status !== status) {
				new HeatingHistory({
					datetime: new Date(),
					status: status
				}).save();
			}
		});
});


function monitorTargetTemp () {
	targetTempService().then(target => {
		TargetTempHistory
			.findOne()
			.sort({
				datetime: -1
			})
			.exec()
			.then((result) => {
				if (!result || result.t !== target) {
					new TargetTempHistory({
						datetime: new Date(),
						t: target
					}).save();
				}
			});
		});
}
monitorTargetTemp();
setInterval(monitorTargetTemp, 60000);


async function calculateHeatingDuration (date) {
	if (!date) {
		date = new Date(moment().tz("Europe/Bucharest"));
	}

	const [lastHistory, history] = await Promise.all([
		HeatingHistory
			.findOne({
				datetime: {
					$lt: moment(date).tz("Europe/Bucharest").startOf('day')
				}
			})
			.sort({
				datetime: -1
			})
			.exec(),
		HeatingHistory
			.find({
				datetime: {
					$gt: moment(date).tz("Europe/Bucharest").startOf('day'),
					$lt: moment(date).tz("Europe/Bucharest").endOf('day')
				}
			})
			.sort({
				datetime: 1
			})
			.exec()
	])

	if (!history || !history.length) {
		return 0;
	}

	history.unshift({
		datetime: new Date(moment(date).tz("Europe/Bucharest").startOf('day')),
		status: lastHistory ? lastHistory.status : (history[0] ? !history[0].status : false)
	});

	history.push({
		datetime: new Date(Math.min(new Date(moment().tz("Europe/Bucharest")), new Date(moment(date).tz("Europe/Bucharest").endOf('day')))),
		status: false
	});

	let heatingDuration = 0; // minutes
	let lastEntry = null;

	history.forEach(entry => {
		if (lastEntry) {
			if (lastEntry.status === true && entry.status === false) {
				heatingDuration += (new Date(moment(entry.datetime)).getTime() - new Date(moment(lastEntry.datetime).tz("Europe/Bucharest")).getTime()) / 60000;
			}

			if (lastEntry.status !== entry.status) {
				lastEntry = entry;
			}
		} else {
			lastEntry = entry;
		}
	});

	return Math.round(heatingDuration);
}

async function calculateAvgTargetTemp (date) {
	if (!date) {
		date = new Date(moment().tz("Europe/Bucharest"));
	}

	const [initial, rest] = await Promise.all([
		TargetTempHistory
			.findOne({
				datetime: {
					$lt: new Date(moment(date).tz("Europe/Bucharest").startOf('day'))
				}
			})
			.sort({
				datetime: -1
			})
			.exec(),
		TargetTempHistory
			.find({
				datetime: {
					$gt: new Date(moment(date).tz("Europe/Bucharest").startOf('day')),
					$lt: new Date(moment(date).tz("Europe/Bucharest").endOf('day'))
				}
			})
			.sort({
				datetime: 1
			})
			.exec()
	]);

	let results;
	if (initial) {
		initial.datetime = new Date(moment(date).tz("Europe/Bucharest").startOf('day'));
		results = [initial, ...rest];
	} else {
		results = rest;
	}

	if (!results || !results.length) {
		return null;
	}

	let measuredTimeTotal = 0; // minutes
	let measuredValueTotal = 0;
	let lastEntry = null;
	let duration;

	results.forEach(entry => {
		if (lastEntry) {
			duration = (entry.datetime.getTime() - lastEntry.datetime.getTime()) / 60000;

			measuredTimeTotal += duration;
			measuredValueTotal += lastEntry.t * duration;

			lastEntry = entry;
		} else {
			lastEntry = entry;
		}
	});

	duration = (new Date(moment(date).tz("Europe/Bucharest").endOf('day')).getTime() - lastEntry.datetime.getTime()) / 60000;
	measuredTimeTotal += duration;
	measuredValueTotal += lastEntry.t * duration;

	return measuredValueTotal / measuredTimeTotal;
}

async function calculateAvgOutsideCondition (date) {
	if (!date) {
		date = new Date(moment().tz("Europe/Bucharest"));
	}

	const [initial, rest] = await Promise.all([
		OutsideConditionHistory
			.findOne({
				datetime: {
					$lt: new Date(moment(date).tz("Europe/Bucharest").startOf('day'))
				}
			})
			.sort({
				datetime: -1
			})
			.exec(),
		OutsideConditionHistory
			.find({
				datetime: {
					$gt: new Date(moment(date).tz("Europe/Bucharest").startOf('day')),
					$lt: new Date(moment(date).tz("Europe/Bucharest").endOf('day'))
				}
			})
			.sort({
				datetime: 1
			})
			.exec()
	]);

	let results = [];
	if (initial) {
		initial.datetime = new Date(moment(date).tz("Europe/Bucharest").startOf('day'));
		results = [initial, ...rest];
	} else {
		results = rest;
	}

	if (!results || !results.length) {
		return {
			t: null,
			h: null
		};
	}

	let measuredTimeTotal = 0; // minutes
	let measuredTempTotal = 0;
	let measuredHumidityTotal = 0;
	let lastEntry = null;
	let duration;

	results.forEach(entry => {
		if (lastEntry) {
			duration = (entry.datetime.getTime() - lastEntry.datetime.getTime()) / 60000;

			measuredTimeTotal += duration;
			measuredTempTotal += lastEntry.t * duration;
			measuredHumidityTotal += lastEntry.h * duration;

			lastEntry = entry;
		} else {
			lastEntry = entry;
		}
	});

	duration = (new Date(moment(date).tz("Europe/Bucharest").endOf('day')).getTime() - lastEntry.datetime.getTime()) / 60000;
	measuredTimeTotal += duration;
	measuredTempTotal += lastEntry.t * duration;
	measuredHumidityTotal += lastEntry.h * duration;

	return {
		t: measuredTempTotal / measuredTimeTotal,
		h: measuredHumidityTotal / measuredTimeTotal
	};
}



const saveStatisticsForADay = async () => {
	console.log('statistics save started');

	let startDate = null;

	try {
		const lastHeatingStatistic = await HeatingStatistics
			.findOne()
			.sort({
				date: -1
			})
			.exec();

		if (lastHeatingStatistic && lastHeatingStatistic.date) {
			startDate = new Date(lastHeatingStatistic.date.getTime() + 24 * 60 * 60 * 1000);
		} else {
			const lastHeatingHistory = await HeatingHistory
				.findOne()
				.sort({
					datetime: 1
				})
				.exec();

			if (lastHeatingHistory && lastHeatingHistory.datetime) {
				startDate = lastHeatingHistory.datetime;
			}
		}
	} catch (e) {
		console.error('error while determining start date for saving statistics', e);
		startDate = null;
	}

	if (startDate) {
		const startDateStart = new Date(moment(startDate).tz("Europe/Bucharest").startOf('day'));
		let currentDate = startDateStart;

		const todayStart = new Date(moment().tz("Europe/Bucharest").startOf('day'));

		while (currentDate < todayStart) {
			try {
				const [heatingDuration, avgTargetTemp, avgOutsideCondition] = await Promise.all([
					calculateHeatingDuration(currentDate),
					calculateAvgTargetTemp(currentDate),
					calculateAvgOutsideCondition(currentDate)
				]);

				await new HeatingStatistics({
					date: new Date(currentDate.getTime() + 12 * 60 * 60 * 1000),
					avgTargetTemp: avgTargetTemp,
					avgOutsideTemp: avgOutsideCondition.t,
					avgOutsideHumi: avgOutsideCondition.h,
					runningMinutes: heatingDuration
				}).save();
			} catch (e) {
				console.error('error while calculating statistics or saving it for date', date, e);
			}

			currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
		}
	}

	console.log('statistics save complete');
};



exports.getStatisticsForToday = async () => {
	const heatingDuration = await calculateHeatingDuration();

	return {
		heatingDuration
	};
};

exports.getStatisticsByDay = async (dateStart, dateEnd) => {
	const heatingStatistics = await HeatingStatistics
		.find({
			date: {
				$gt: new Date(moment(dateStart).tz("Europe/Bucharest").startOf('day')),
				$lt: new Date(moment(dateEnd).tz("Europe/Bucharest").endOf('day'))
			}
		})
		.exec();

	return heatingStatistics || [];
};

exports.getStatisticsByMonth = async (dateStart, dateEnd) => {
	const heatingStatistics = await HeatingStatistics
		.find({
			date: {
				$gt: new Date(moment(dateStart).tz('Europe/Bucharest').startOf('month')),
				$lt: new Date(moment(dateEnd).tz('Europe/Bucharest').endOf('month'))
			}
		})
		.exec();

	const totals = [];
	let currentMonth = null;

	heatingStatistics.forEach(statistic => {
		if (!currentMonth || currentMonth.getTime() != new Date(moment(statistic.date).tz('Europe/Bucharest').startOf('month')).getTime()) {
			currentMonth = new Date(moment(statistic.date).tz('Europe/Bucharest').startOf('month'));
			totals.push({
				date: currentMonth,
				daysRunningMinutes: 0,
				runningMinutesTotal: 0,
				daysTargetTemp: 0,
				targetTempTotal: 0,
				daysOutsideCondition: 0,
				outsideTempTotal: 0,
				outsideHumiTotal: 0
			});
		}

		const currentAvg = totals[totals.length - 1];
		if (statistic.runningMinutes) {
			currentAvg.daysRunningMinutes++;
			currentAvg.runningMinutesTotal += statistic.runningMinutes;
		}

		if (statistic.avgTargetTemp) {
			currentAvg.daysTargetTemp++;
			currentAvg.targetTempTotal += statistic.avgTargetTemp;
		}

		if (statistic.avgOutsideTemp) {
			currentAvg.daysOutsideCondition++;
			currentAvg.outsideTempTotal += statistic.avgOutsideTemp;
			currentAvg.outsideHumiTotal += statistic.avgOutsideHumi;
		}
	});

	const avgs = [];

	totals.forEach(total => {
		avgs.push({
			date: total.date,
			totalRunningMinutes: total.runningMinutesTotal,
			avgRunningMinutes: total.daysRunningMinutes ? total.runningMinutesTotal / total.daysRunningMinutes : 0,
			avgTargetTemp: total.targetTempTotal / total.daysTargetTemp,
			avgOutsideTemp: total.outsideTempTotal / total.daysOutsideCondition,
			avgOutsideHumi: total.outsideHumiTotal / total.daysOutsideCondition
		});
	});

	return avgs;
};


saveStatisticsForADay();
setTimeout(() => {
	saveStatisticsForADay();
	setInterval(saveStatisticsForADay, 24 * 60 * 60 * 1000);
}, new Date(moment().tz("Europe/Bucharest").endOf('day')).getTime() - new Date(moment().tz("Europe/Bucharest")).getTime() + 10);
