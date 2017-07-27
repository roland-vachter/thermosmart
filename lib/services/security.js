const STATUSES = {
	DISARMED: 'disarmed',
	ARMING: 'arming',
	ARMED: 'armed',
	PREACTIVATED: 'preactivated',
	ACTIVATED: 'activated'
};

const ARMED_STATUSES = [STATUSES.ARMED, STATUSES.PREACTIVATED, STATUSES.ACTIVATED];

let status = STATUSES.DISARMED;

const EventEmitter = require('events');
const evts = new EventEmitter();

let timeout;

exports.evts = evts;

exports.getStatus = () => status;

const changeStatus = (newStatus) => {
	status = newStatus;
	evts.emit('status', status);
};

const arm = () => {
	clearTimeout(timeout);
	changeStatus(STATUSES.ARMING);

	timeout = setTimeout(() => {
		changeStatus(STATUSES.ARMED);
	}, 30 * 1000);
};

const disarm = () => {
	clearTimeout(timeout);

	changeStatus(STATUSES.DISARMED);
};

exports.toggleArm = () => {
	if (status === STATUSES.DISARMED) {
		arm();
	} else {
		disarm();
	}
};

exports.movementDetected = () => {
	evts.emit('movement', true);

	if (ARMED_STATUSES.includes(status)) {
		changeStatus(STATUSES.PREACTIVATED);

		clearTimeout(timeout);
		timeout = setTimeout(() => {
			evts.emit('alarm', true);
			changeStatus(STATUSES.ACTIVATED);

			clearTimeout(timeout);
			timeout = setTimeout(() => {
				evts.emit('alarm', false);
				changeStatus(STATUSES.ARMED);
			}, 60 * 1000);
		}, 30 * 1000);
	}
};
