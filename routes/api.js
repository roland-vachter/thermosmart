"use strict";

const express = require('express');
const router = express.Router();

const apiCtrl = require('../lib/controllers/apiCtrl');
const loginMiddleware = require('../lib/middlewares/login');


/* GET home page. */
router.get('/init', loginMiddleware, apiCtrl.init);

module.exports = router;
