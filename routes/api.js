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
router.get('/sensorpolling', apiKeyMiddleware, cors(), apiCtrl.sensorPolling);

module.exports = router;
