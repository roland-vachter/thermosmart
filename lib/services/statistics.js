const OutsideConditionHistory = require('../models/OutsideConditionHistory');
const outsideConditions = require('./outsideConditions');

const HeatingHistory = require('../models/HeatingHistory');
const heatingService = require('./heating.js');

const TargetTempHistory = require('../models/TargetTempHistory');
const targetTempService = require('./targetTemp');


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
		.sort({datetime: -1})
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
			.sort({datetime: -1})
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
