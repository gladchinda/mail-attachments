const _ = require('lodash');
const mysql = require('mysql');
const Config = require('../config').db;

let POOLS = {};

module.exports = {

	connection: (config = 'default', __DEPS__ = {}) => {

		if (POOLS[config]) return POOLS[config];

		let logger = null;

		if (_.isPlainObject(__DEPS__)) {
			({ logger = null }) = __DEPS__
		}

		const DB_CONFIG = Config[config] || {};
		const pool = mysql.createPool(DB_CONFIG);

		pool.getConnection((err, connection) => {
			if (err) {
				let message = 'A database connection error occurred.';

				switch (err.code) {
					case 'PROTOCOL_CONNECTION_LOST':
						message = 'Database connection was closed.';
						break;

					case 'ER_CON_COUNT_ERROR':
						message = 'Database has too many connections.';
						break;

					case 'ECONNREFUSED':
						message = 'Database connection was refused.';
						break;

					default:
						message = 'A database connection error occurred.';
						break;
				}

				(logger && logger.error && typeof (logger.error) === 'function')
					? logger.error(`${message} Error: %s`, err)
					: console.error(message);

				throw err;
			}

			if (connection) connection.release();

			return;
		});

		POOLS = { ...POOLS, [config]: pool };

		return pool;

	}

};
