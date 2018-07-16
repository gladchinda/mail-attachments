const express = require('express');
const dotenv = require('dotenv').config();
const MailService = require('./services/mail');
const fetchRecentMail = require('./actions/fetchRecentMail');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('port', PORT);

MailService.open()
	.then(fetchRecentMail)
	.catch(console.error);

app.listen(PORT, () => console.log(`> Server running on: http://localhost:${PORT}`));
