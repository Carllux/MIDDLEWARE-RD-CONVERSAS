const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const routes = require('./routes/trackingRoutes');
const errorHandler = require('./middlewares/errorHandler');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(routes);

app.use(errorHandler);

module.exports = app;
