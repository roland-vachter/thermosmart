'use strict';

const Router = require('express').Router;
const router = new Router();

router.use('/login/facebook', require('./routes/facebookLogin'));

router.use('/api', require('./routes/api'));
router.use('/', require('./routes/index'));

module.exports = router;
