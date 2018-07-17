const _ = require('lodash');
const Parser = require('../services/parser');

module.exports = ({ imap, box }) => {

	const criteria = ['ALL', ['SINCE', 'July 01, 2018'], ['FROM', 'omniecobank@flutterwavego.com']];

	imap.search(criteria, (err, results) => {

		if (err) throw err;

		const f = imap.fetch(results, { bodies: '', struct: true });

		f.on('message', function (msg, seqno) {

			let mail = Buffer.from('');

			msg.on('body', (stream, info) => {
				stream.on('data', chunk => {
					mail = Buffer.concat([ mail, chunk ]);
				});
			});

			msg.once('attributes', attrs => { /* log mail attributes */ });

			msg.once('end', () => {
				const attachments = Parser.getMessageAttachmentParts(mail);

				const records = attachments.map(attachment => {
					const { buffer: data } = attachment;
					return Parser.extractRecordsFromSheetData(data);
				});
			});

		});

		f.once('error', err => { /* handle fetch message error */ });

		f.once('end', () => {
			imap.end();
		});

	});

}
