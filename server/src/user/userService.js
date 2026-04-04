//load the environment variables
require('dotenv').config();

//dependencies
const userModel = require('./userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const emailService = require('./emailService');
const redis = require('redis');
const client = redis.createClient();

//JWT secret key
const JWT_SECRET = process.env.JWT_SECRET;

//register service
module.exports.registerUserService = (userDetails) => {

    return new Promise((resolve, reject) => {

        //check if email already exists
        userModel.findOne({ email: userDetails.email })
            .then((existingUser) => {

                if (existingUser) {
                    reject({ message: "User already exists." });
                    return;
                }

                return bcrypt.hash(userDetails.password, 10);
            })
            .then((hashedPassword) => {

                //create the user
                const userModelData = new userModel();

                userModelData.name = userDetails.name;
                userModelData.email = userDetails.email;
                userModelData.passwordHash = hashedPassword;

                return userModelData.save();
            })
            .then((user) => {

                //login after registration
                const token = jwt.sign(
                    { id: user._id, email: user.email },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                resolve({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    token: token
                });
            })
            .catch((error) => {
                reject(error)
            });
    })
}

//login service
module.exports.loginUserService = (email, password) => {

    return new Promise((resolve, reject) => {

        let foundUser;

        //find user by email
        userModel.findOne({ email: email })
            .then((user) => {

                if (!user) {
                    reject({ message: "Invalid email or password." });
                    return;
                }

                foundUser = user;

                return bcrypt.compare(password, user.password);
            })
            .then((passwordMatch) => {

                if (!passwordMatch) {
                    reject({ message: "Invalid email or password." })
                }

                //create the JWT token
                const token = jwt.sign(
                    { id: user._id, email: user.email },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                resolve({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    token: token
                });
            })
            .catch((error) => {
                reject(error);
            });
    });
}

function isTokenRevoked(jti, callback) {
    client.get(jti, (err, reply) => {
        callback(reply === 'revoked');
    });
}

//logout service
module.exports.logoutUserService = (req) => {

    return new Promise((resolve, reject) => {
        const token = req.headers['authorization'];
        const secret = process.env.JWT_SECRET;
        const decoded = jwt.verify(token, secret);
        const expiry = 3600;

        if (!token) {
            reject({ message: "Access token required." })
        }

        //check if token is in blacklist
        isTokenRevoked(decoded.jti, (isRevoked) => {
            if (isRevoked) {
                reject('Session is already terminated.');
            }
        });

        //add token to blacklist
        then(() => {
            resolve(client.set(decoded.jti, 'revoked', 'EX', expiry));
        }).catch((error) => {
            reject(error);
        });
    });
}

//user profile service
module.exports.getUserService = (id) => {

    return new Promise((resolve, reject) => {
        if (!id) {
            reject({ message: "User is not authenticated." })
        }

        //find user by ID
        userModel.findOne({ _id: id })
            .then((user) => {
                if (!user) {
                    reject({ message: "User profile could not be found." });
                    return;
                }

                resolve(user);
            })
            .catch((error) => {
                reject(error);
            });
    });
}
