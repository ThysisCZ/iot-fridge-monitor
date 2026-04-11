//load the environment variables
require('dotenv').config();

//dependencies
const userModel = require('./userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const emailService = require('../email/emailService');
const revokedTokenModel = require('../revokedToken/revokedTokenModel');

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
                    { id: user.id, email: user.email },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                resolve({
                    id: user.id,
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

                return bcrypt.compare(password, user.passwordHash);
            })
            .then((passwordMatch) => {

                if (!passwordMatch) {
                    reject({ message: "Invalid email or password." })
                }

                //create the JWT token
                const token = jwt.sign(
                    { id: foundUser.id, email: foundUser.email },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                resolve({
                    id: user.id,
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

//logout service
module.exports.logoutUserService = (token) => {
    return new Promise((resolve, reject) => {

        if (!token) {
            reject({ message: "Access token required." });
            return;
        }

        //check if token is already revoked
        revokedTokenModel.findOne({ token: token })
            .then((revokedToken) => {
                if (revokedToken) {
                    reject({ message: "Session is already terminated." });
                    return;
                }

                //add token to revoked tokens
                const revokedTokenData = new revokedTokenModel();
                revokedTokenData.token = token;

                return revokedTokenData.save();
            })
            .then(() => {
                resolve({ message: "Logged out successfully." });
            })
            .catch((error) => {
                reject(error);
            });
    });
};

//user profile service
module.exports.getUserService = (id) => {

    return new Promise((resolve, reject) => {
        if (!id) {
            reject({ message: "User is not authenticated." });
            return;
        }

        //find user by ID
        userModel.findById(id)
            .then((user) => {
                if (!user) {
                    reject({ message: "User profile could not be found." });
                    return;
                }

                resolve({
                    id: user.id,
                    name: user.name,
                    email: user.email
                });
            })
            .catch((error) => {
                reject(error);
            });
    });
}
