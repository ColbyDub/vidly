const mongoose = require('mongoose');
const winston = require('winston');
const config = require('config');

module.exports = function() {
    const db = config.get('db');
    mongoose.connect(db, { useNewUrlParser: true ,  useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false })
        .then(() => winston.info(`Connected to ${db}...`))
}