const debug = require('debug')('app:startup');
const express = require('express');
const winston = require('winston');
const app = express();

require('./startup/routes')(app);
require('./startup/db')();
require('./startup/logging')();
require('./startup/config')();
require('./startup/validation')();
reuire('./startup/prod')(app);

//Port and listener
const port = process.env.PORT || 3000;
const server = app.listen(port, () => winston.info(`Listening on port ${port}...`));

module.exports = server;