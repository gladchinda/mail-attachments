const fs = require('fs');
const _ = require('lodash');
const path = require('path');

/**
 * Returns a function that gets the value from an environment variable.
 * A default value or null is returned if the variable does not exist.
 *
 * @param {string} config The environment variable
 * @param {any} defaultValue The default value to be used if no value was found
 */
const env = (config, defaultValue = null) => {
	defaultValue = defaultValue || null;

	// Return default if config is not a string
	if (!_.isString(config)) return defaultValue;

	const value = process.env[config];

	// Return config value or defaultValue
	return value || defaultValue;
};

/**
 * Returns a function for creating file descriptors for the given file
 * with the flag passed in as arguments.
 *
 * @param {string} file File path
 */
const getFilePointer = file => flag => {
	const dir = path.dirname(file);

	// create directory if it doesn't exist
	!fs.existsSync(dir) && fs.mkdirSync(dir);

	// return file pointer to the file
	return fs.openSync(file, flag);
}

module.exports = {
	env,
	getFilePointer
};
