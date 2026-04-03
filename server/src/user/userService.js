//load the environment variables
require('dotenv').config();

//dependencies
const userModel = require('./userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const emailService = require('./emailService');

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
    })
}
