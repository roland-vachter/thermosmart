"use strict";

const express = require('express');
const router = new express.Router();
const facebookLoginCtrl = require('../lib/controllers/facebookLoginCtrl');

router.get('/', facebookLoginCtrl.auth);

// handle the callback after facebook has authenticated the user
router.get('/callback', facebookLoginCtrl.callback);

router.get('/forbidden', facebookLoginCtrl.forbidden);

router.get('/checkstatus', facebookLoginCtrl.checkStatus);

module.exports = router;
