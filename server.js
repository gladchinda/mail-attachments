const express = require('express');
const dotenv = require('dotenv').config();
const Mail = require('./app/services/Mail');
const fetchRecordsFromSheet = require('./app/helpers/actions/fetchRecordsFromSheet');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('port', PORT);

app.get('/records', (req, res) => {
	Mail.open()
		.then(fetchRecordsFromSheet)
		.then(records => res.json({ status: 'success', data: { count: records.length, records } }))
		.catch(err => {
			console.error(err);

			res.status(500).json({
				status: 'failed',
				error: 'SERVICE_ERROR',
				message: 'Could not fetch records at this time. Please try again later.'
			});
		});
});

app.listen(PORT, () => console.log(`> Server running on: http://localhost:${PORT}`));
