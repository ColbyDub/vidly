const winston = require('winston');
//require('winston-mongodb');
require('express-async-errors');

module.exports = function() {
    winston.exceptions.handle( 
        new winston.transports.File({ filename: 'uncaughtExceptions.log' }),
        new winston.transports.Console()
        );
    
    process.on('unhandledRejection', (ex) => {
        throw ex;
    });
    winston.add(new winston.transports.File({ filename: 'logfile.log', level: 'debug'}));
    //winston.add(new winston.transports.MongoDB({ db: 'mongodb://localhost/vidly'}));
    //winston.add(new winston.transports.Console({ level: 'info' , level: 'debug',  }));
}