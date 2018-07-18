const Utils = require('./helpers/utilities');
const env = Utils.env;

module.exports = {

	db: {
		'default': {
			host: env('DATABASE_HOST', 'localhost'),
			user: env('DATABASE_USER', 'root'),
			password: env('DATABASE_PASSWORD', ''),
			database: env('DATABASE_NAME', 'database'),
			dateStrings: false,
			timezone: 'Z'
		}
	},

	pusher: {
		'default': {
			appId: env('PUSHER_APP_ID', null),
			key: env('PUSHER_APP_KEY', ''),
			secret: env('PUSHER_APP_SECRET', ''),
			cluster: env('PUSHER_APP_CLUSTER', null),
			encrypted: true
		}
	},

	mail: {
		imap: {
			'default': {
				user: env('MAIL_IMAP_USERNAME', null),
				password: env('MAIL_IMAP_PASSWORD', ''),
				host: env('MAIL_IMAP_HOST', null),
				port: env('MAIL_IMAP_PORT', 993),
				tls: true
			}
		}
	}

};
