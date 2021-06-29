const config = require('config');
const winston = require('winston');

module.exports = function() {
    if(!config.get('jwtPrivateKey')){
        throw new Error('FATAL ERROR: jwtPrivateKey is not defined.');
    }

    winston.info('Application Name: ' + config.get('name'));
    winston.info('Mail Server: ' + config.get('mail.host'));
}