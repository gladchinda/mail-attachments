const _ = require('lodash');
const Parser = require('../services/parser');

module.exports = ({ imap, box }) => new Promise((resolve, reject) => {

	const criteria = ['ALL', ['SINCE', 'July 01, 2018'], ['FROM', 'omniecobank@flutterwavego.com']];

	imap.search(criteria, (err, results) => {

		if (err) reject(err);

		const fetchedRecords = [];
		const f = imap.fetch(results, { bodies: '', struct: true });

		f.on('message', (msg, seqno) => {

			let mail = Buffer.from('');

			msg.on('body', (stream, info) => {
				stream.on('data', chunk => {
					mail = Buffer.concat([ mail, chunk ]);
				});
			});

			msg.once('attributes', attrs => { /* log mail attributes */ });

			msg.once('end', () => {
				const message = mail.toString('utf8');
				const attachments = Parser.getMessageExcelFileAttachments(message);

				const records = attachments.map(attachment => {
					const { buffer: data } = attachment;
					const { records = [] } = Parser.extractRecordsFromSheetData(data);
					return records;
				});

				fetchedRecords.push(_.flatten(records));
			});

		});

		f.once('error', err => {
			// handle fetch message error
			reject(err);
		});

		f.once('end', () => {
			imap.end();
			resolve(_.flatten(fetchedRecords));
		});

	});

});
