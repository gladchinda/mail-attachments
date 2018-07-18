const Pusher = require('pusher');
const Config = require('../config').pusher;

const CONNECTIONS = {};

module.exports = {

	connection: (name = 'default') => {

		if (CONNECTIONS[name]) return CONNECTIONS[name];

		const config = Config[name] || Config['default'];
		const pusher = new Pusher({ ...config, encrypted: true });

		CONNECTIONS[name] = pusher;
		return pusher;

	}

};
