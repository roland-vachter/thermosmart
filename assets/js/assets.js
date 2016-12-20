"use strict";

const assetsDomain = require('../../build_config/js/assetsDomain');
const fingerprint = require('../../build_config/js/fingerprint');

exports.inApp = assetsDomain + '/assets/' + fingerprint + '/';
exports.bower = assetsDomain + '/assets/bower/' + fingerprint + '/';
