"use strict";

const express = require('express');
const router = express.Router();

const apiCtrl = require('../lib/controllers/apiCtrl');
const loginMiddleware = require('../lib/middlewares/login');
const apiKeyMiddleware = require('../lib/middlewares/apiKey');
const cors = require('cors');

router.get('/init', loginMiddleware, cors(), apiCtrl.init);
router.post('/tempadjust', loginMiddleware, cors(), apiCtrl.tempAdjust);
router.post('/restartsensor', loginMiddleware, cors(), apiCtrl.restartSensor);
router.post('/togglesensorstatus', loginMiddleware, cors(), apiCtrl.toggleSensorStatus);
router.post('/changesensorlabel', loginMiddleware, cors(), apiCtrl.changeSensorLabel);
router.post('/changedefaultplan', loginMiddleware, cors(), apiCtrl.changeDefaultPlan);
router.post('/securitytogglealarm', loginMiddleware, cors(), apiCtrl.securityToggleAlarm);
router.get('/sensorpolling', apiKeyMiddleware, cors(), apiCtrl.sensorPolling);
router.get('/statistics', loginMiddleware, cors(), apiCtrl.statistics);

module.exports = router;
