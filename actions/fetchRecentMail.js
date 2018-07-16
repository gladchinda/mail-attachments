const fs = require('fs');
const path = require('path');
const Busboy = require('busboy');
const inspect = require('util').inspect;
const httpHeaders = require('http-headers');
const parseMultipart = require('parse-multipart');

module.exports = ({ imap, box }) => {

	imap.search(['ALL', ['SINCE', 'July 01, 2018'], ['FROM', 'omniecobank@flutterwavego.com'] ], function (err, results) {

		if (err) throw err;

		var f = imap.fetch(results, { bodies: '', struct: true });

		f.on('message', function (msg, seqno) {

			var busboy = null;

			console.log('Message #%d', seqno);
			var prefix = '(#' + seqno + ') ';

			msg.on('body', function (stream, info) {
				console.log(prefix + 'Body');
				// let boundary = null;
				// let buffer = '';

				// stream.on('data', (chunk) => {
				// 	buffer += chunk.toString('utf8');
				// });

				// stream.on('end', () => {
				// 	if (info.which !== 'TEXT') {
				// 		const headers = httpHeaders(buffer, true);
				// 		const [, _boundary] = (headers['content-type'] || '').match(/^.*?boundary="(.+)".*?$/);
				// 		boundary = _boundary;
				// 		console.log(boundary);
				// 	} else {
				// 		const parts = new RegExp(`${boundary}\\\s+(.+?)\\\s+${boundary}`, 'mg');
				// 		console.log(parts);
				// 	}
				// 	// busboy = new Busboy({ headers });

				// 	// busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
				// 	// 	console.log(fieldname, filename, encoding, mimetype);

				// 	// 	file.on('data', function (data) {
				// 	// 		console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
				// 	// 	});

				// 	// 	file.on('end', function () {
				// 	// 		console.log('File [' + fieldname + '] Finished');
				// 	// 	});

				// 	// });

				// 	// busboy.on('finish', function () {
				// 	// 	console.log('Done parsing mail!');
				// 	// });

				// });

				// busboy && stream.pipe(busboy);
				stream.pipe(fs.createWriteStream('msg-' + seqno + '-body.txt'));

			});

			msg.once('attributes', function (attrs) {
				console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
			});

			msg.once('end', function () {
				console.log(prefix + 'Finished');

				const mailData = fs.readFileSync(path.join(__dirname, '..', 'msg-' + seqno + '-body.txt')).toString('utf8');

				const headers = httpHeaders(mailData);
				let [, boundary = ''] = (headers['content-type'] || '').match(/^.*?boundary="(.+)".*?$/) || [];

				boundary = `--${boundary.replace(/([\.])/g, '\\$1')}`;

				const partsRegex = new RegExp(`(?<=\\\s+${boundary})([\\s\\S]+?)(?=${boundary})`, 'ig');
				const parts = mailData.match(partsRegex) || [];

				console.log(parts.map(part => httpHeaders(part)));
			});

		});

		f.once('error', function (err) {
			console.log('Fetch error: ' + err);
		});

		f.once('end', function () {
			console.log('Done fetching all messages!');
			imap.end();
		});

	});

}
