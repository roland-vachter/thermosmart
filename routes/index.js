"use strict";

const express = require('express');
const router = express.Router();

const indexCtrl = require('../lib/controllers/indexCtrl');
const loginMiddleware = require('../lib/middlewares/login');


/* GET home page. */
router.get('/', loginMiddleware, indexCtrl);

module.exports = router;
