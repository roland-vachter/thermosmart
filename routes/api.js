"use strict";

const express = require('express');
const router = express.Router();

const apiCtrl = require('../lib/controllers/apiCtrl');
const loginMiddleware = require('../lib/middlewares/login');

router.get('/init', loginMiddleware, apiCtrl.init);
router.post('/tempadjust', loginMiddleware, apiCtrl.tempAdjust);

module.exports = router;
