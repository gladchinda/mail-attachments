const _ = require('lodash');
const XLSX = require('xlsx');
const httpHeaders = require('http-headers');

const getMultipartBoundary = headers => {
	if (_.isPlainObject(headers)) {
		const [, boundary = null] = (headers['content-type'] || '').match(/^.*?boundary="(.+)".*?$/) || [];
		return boundary;
	}

	return null;
}

const getMessageParts = message => {
	const headers = httpHeaders(message);
	const boundary = getMultipartBoundary(headers);

	if (boundary && _.isString(boundary)) {

		// const TYPE_REGEX = /^\s*(.*?)(?=\;.*)/;
		const BODY_REGEX = /(?<=\r\n\r\n)([\s\S]+)/g;
		const MIME_REGEX = /^[^\/\s]+\/[^\/\s]+$/;
		const PAIR_REGEX = /^([^\=\s]+)=("?)([^\=\"\s][^\=]+[^\=\"\s])\2$/;
		const HEADER_META_REGEX = /\s*(\S+?)(?=\s*?\;)|(?<=\s*?\;\s*?)(\S+?\=".+?")(?=\s*?\;?)/g;
		const ENCODINGS = ['7bit', '8bit', 'base64', 'binary', 'quoted-printable', 'x-token'];
		const DISPOSITIONS = ['attachment', 'token'];

		const dashedBoundary = `--${boundary.replace(/([\.])/g, '\\$1')}`;
		const BOUNDARY_REGEX = new RegExp(`(?<=\\\s+${dashedBoundary})([\\s\\S]+?)(?=${dashedBoundary})`, 'ig');

		const parts = message.match(BOUNDARY_REGEX) || [];

		return parts.map((part, index) => {
			const headers = httpHeaders(part);
			const [ body = '' ] = part.match(BODY_REGEX) || [];

			const _type = headers['content-type'] || '';
			const _disposition = headers['content-disposition'] || '';
			const _encoding = (headers['content-transfer-encoding'] || '').toLowerCase();

			const encoding = _.includes(ENCODINGS, _encoding) ? _encoding : '7bit';
			const [ type = '', ..._meta ] = _type.match(HEADER_META_REGEX) || [];
			const [ disp = '', ..._dispMeta ] = _disposition.match(HEADER_META_REGEX) || [];

			const mime = MIME_REGEX.test(type) ? type.toLowerCase() : null;
			const disposition = _.includes(DISPOSITIONS, disp.toLowerCase()) ? disp.toLowerCase() : null;

			const typeMeta = _meta.reduce((meta, pair = '') => {
				const [, key,, value] = pair.match(PAIR_REGEX) || [];

				return (key && value)
					? { ...meta, [key.toLowerCase()]: value }
					: meta;
			}, {});

			const dispMeta = _dispMeta.reduce((meta, pair = '') => {
				const [, key, , value] = pair.match(PAIR_REGEX) || [];

				return (key && value && key.toLowerCase() === 'filename')
					? { ...meta, [key.toLowerCase()]: value }
					: meta;
			}, {});

			let bufferEncoding = 'utf8';

			if (body && encoding) {
				switch (encoding) {

					case 'binary':
					case 'base64':
						bufferEncoding = encoding;
						break;

					case '7bit':
						bufferEncoding = 'ascii';
						break;

					case '8bit':
						bufferEncoding = 'utf8';
						break;

					default:
						bufferEncoding = 'utf8';
						break;

				}
			}

			const { filename = null } = dispMeta || {};

			return {
				encoding,
				disposition,
				filename,
				type: { mime, meta: (_.keys(typeMeta).length > 0) ? typeMeta : null, header: _type },
				body: body.replace(/(\r\n)/g, ''),
				buffer: Buffer.from(body, bufferEncoding)
			};
		});

	}

	return [];
}

const getMessageAttachmentParts = message => {
	const parts = getMessageParts(message);

	return parts.filter(part => {
		const attachment = part.disposition === 'attachment';
		const octet = part.type.mime === 'application/octet-stream';
		return octet && attachment;
	});
}

const extractRecordsFromSheetData = buffer => {
	const wb = XLSX.read(buffer);
	const sheetname = wb.SheetNames[0];
	const sheet = wb.Sheets[sheetname];

	const rows = XLSX.utils.sheet_to_json(sheet, { header: 'A' });

	const [ head = {}, ...data ] = rows.filter(row => _.keys(row).length > 1);
	const headings = _.toArray(head).map(_.snakeCase);

	const records = data.map(row => {
		return _.keys(row).reduce((obj, key) => {
			const field = head[key];

			return (field)
				? { ...obj, [_.snakeCase(field)]: row[key] }
				: obj;
		}, {});
	});

	return {
		headings,
		records,
		count: records.length
	};
}

module.exports = {
	getMessageParts,
	getMultipartBoundary,
	getMessageAttachmentParts,
	extractRecordsFromSheetData
};
