//dependencies
const userService = require('./userService');

async function registerUserController(req, res) {

    try {
        const userDetails = {
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        }

        const result = await userService.registerUserService(userDetails);

        res.status(201).send(result);
    } catch (error) {
        res.status(500).send({ success: false, message: "Failed to register the user." })
    }
}

//login controller
async function loginUserController(req, res) {

    try {
        const { email, password } = req.body;

        const result = await userService.loginUserService(email, password);

        res.status(200).send(result);

    } catch (error) {
        res.status(500).send({ success: false, message: "Failed to login the user." });
    }
};

//logout controller
async function logoutUserController(req, res) {

    try {
        const token = req.headers['authorization'].split(' ')[1];

        const result = await userService.logoutUserService(token);

        res.status(200).send(result);

    } catch (error) {
        res.status(500).send({ success: false, message: "Failed to logout the user." });
    }
};

//user profile controller
async function getUserController(req, res) {

    try {
        const result = await userService.getUserService(req.user.id);

        res.status(200).send(result);

    } catch (error) {
        res.status(500).send({ success: false, message: "Failed to retrieve user profile from the database." });
    }
};

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getUserController
}