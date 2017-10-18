"use strict";

const express = require('express');
const router = express.Router();

const apiCtrl = require('../lib/controllers/apiCtrl');
const loginMiddleware = require('../lib/middlewares/login');
const apiKeyMiddleware = require('../lib/middlewares/apiKey');
const cors = require('cors');

router.get('/init', loginMiddleware, cors(), apiCtrl.init);
router.post('/tempadjust', loginMiddleware, cors(), apiCtrl.tempAdjust);
router.post('/changedefaultplan', loginMiddleware, cors(), apiCtrl.changeDefaultPlan);
router.post('/securitytogglealarm', loginMiddleware, cors(), apiCtrl.securityToggleAlarm);
router.get('/sensorpolling', apiKeyMiddleware, cors(), apiCtrl.sensorPolling);
router.get('/statistics', apiKeyMiddleware, cors(), apiCtrl.statistics);

module.exports = router;
