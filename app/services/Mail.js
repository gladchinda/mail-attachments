const Imap = require('imap');

const imap = new Imap({
	user: process.env.EMAIL_USERNAME,
	password: process.env.EMAIL_PASSWORD,
	host: process.env.EMAIL_HOST,
	port: process.env.EMAIL_PORT || 993,
	tls: true
});

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
