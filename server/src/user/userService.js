//load the environment variables
require('dotenv').config();

//dependencies
const userModel = require('./userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const emailService = require('./emailService');

//JWT secret key
const JWT_SECRET = process.env.JWT_SECRET;