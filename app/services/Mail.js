const Imap = require('imap');
const Config = require('../config').mail;

const imap = new Imap(Config.imap.default);

const connectAndOpenInbox = () => new Promise((resolve, reject) => {

	imap.once('ready', () => {
		imap.openBox('INBOX', true, (err, box) => {
			return (err) ? reject(err) : resolve({ imap, box });
		});
	});

	imap.once('error', (err) => reject(err));

	imap.once('end', () => console.log('Connection ended.'));

	imap.connect();

});

module.exports = {
	open: connectAndOpenInbox
};
