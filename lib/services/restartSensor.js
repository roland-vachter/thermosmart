const EventEmitter = require('events');
const evts = new EventEmitter();

let restartInProgress = false;


exports.evts = evts;

exports.initiate = () => {
	if (restartInProgress === false) {
		restartInProgress = true;
		evts.emit('change', restartInProgress);

		setTimeout(() => {
			restartInProgress = false;
			evts.emit('change', restartInProgress);
		}, 60000);
	}
};

exports.getStatus = () => {
	return restartInProgress;
};
