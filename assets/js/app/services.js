/* global $, io */

"use strict";

const module = require('./module');

module.service('socketio', ($rootScope) => {
	const socket = io.connect('/frontend');
	return {
		on: function(eventName, callback) {
			socket.on(eventName, function() {
				const args = arguments;
				$rootScope.$apply(function() {
					callback.apply(socket, args);
				});
			});
		},
		emit: function(eventName, data, callback) {
			socket.emit(eventName, data, function() {
				const args = arguments;
				$rootScope.$apply(function() {
					if (callback) {
						callback.apply(socket, args);
					}
				});
			});
		}
	};
});

module.service('loginStatus', ($http) => {
	const url = '/login/facebook/checkstatus';

	return {
		check: function () {
			$http.get(url).then(function () {
				// do nothing, user is logged in
			}, function () {
				document.location.reload();
			});
		}
	};
});

module.service('passcode', () => {
	console.log('service initialized');

	const passCodeEl = $('#security-passcode');
	const passCodeEvt = $({});
	let modalOpen = false;

	const securityKeypadModal = $('.security-keypad--modal');

	const changeValue = value => {
		passCodeEl.removeClass('color-border-red');
		passCodeEl.val(value);
		passCodeEvt.trigger('change', value);

		if (passCodeEl.val().length === 4) {
			if (passCodeEl.val() === '1423') {
				passCodeEvt.trigger('valid');
			} else {
				passCodeEvt.trigger('invalid');
				passCodeEl.addClass('color-border-red');
			}
		}
	};

	const onKeyPress = key => {
		const numberKey = parseInt(key, 10);
		if (numberKey >= 0 && numberKey <= 9) {
			if (passCodeEl.val().length >= 4) {
				changeValue('');
			}

			changeValue(passCodeEl.val() + '' + numberKey);
		}

		if (key === 'Backspace') {
			changeValue(passCodeEl.val().substr(0, passCodeEl.val().length - 1));
		}

		if (key === 'Delete') {
			changeValue('');
		}
	};

	document.addEventListener('keyup', evt => {
		if (modalOpen) {
			onKeyPress(evt.key);
		}
	});

	securityKeypadModal.on('click', evt => {
		onKeyPress(evt.target.getAttribute('data-value'));
	});

	securityKeypadModal.on('show.bs.modal', () => {
		modalOpen = true;

		changeValue('');
	});

	securityKeypadModal.on('hide.bs.modal', () => {
		modalOpen = false;

		passCodeEvt.trigger('closed');

		changeValue('');
	});

	return {
		check: () => {
			return new Promise((resolve) => {
				securityKeypadModal.modal('show');

				const onValid = () => {
					passCodeEvt.off('valid', onValid);
					passCodeEvt.off('closed', onClosed);

					resolve({
						status: 'valid'
					});
					securityKeypadModal.modal('hide');
				};

				const onClosed = () => {
					passCodeEvt.off('valid', onValid);
					passCodeEvt.off('closed', onClosed);

					resolve({
						status: 'closed'
					});
				};

				passCodeEvt.on('valid', onValid);
				passCodeEvt.on('closed', onClosed);
			});
		}
	};
});
