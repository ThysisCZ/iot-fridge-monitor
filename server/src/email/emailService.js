//dependencies
require('dotenv').config();
const userModel = require('../user/userModel');
const SibApiV3Sdk = require('sib-api-v3-sdk');

//configure Brevo API key
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

//sender details
const SENDER = {
    name: 'Fridge Monitor',
    email: process.env.BREVO_SENDER_EMAIL
};

//send alert email
module.exports.sendAlertEmail = (userId, sensorType, currentValue, minThreshold, maxThreshold) => {

    //initialize transactional emails API
    const transactionalEmailsApi = new SibApiV3Sdk.TransactionalEmailsApi();

    return new Promise((resolve, reject) => {

        userModel.findById(userId)
            .then((user) => {
                if (!user) {
                    throw {
                        message: 'User not found.',
                        code: 'userNotFound'
                    };
                }

                //determine unit based on sensor type
                const units = {
                    temperature: '°C',
                    humidity: '%',
                    illuminance: 'lux'
                };

                const unit = units[sensorType] || '';

                //compose email
                const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

                sendSmtpEmail.sender = SENDER;
                sendSmtpEmail.to = [{ email: user.email, name: user.name }];
                sendSmtpEmail.subject = `Fridge Monitor Alert: ${sensorType} threshold exceeded`;
                sendSmtpEmail.htmlContent = `
                    <h2>Fridge Monitor Alert</h2>
                    <p>A threshold violation has been detected in your fridge.</p>
                    <table>
                        <tr>
                            <td><strong>Condition</strong></td>
                            <td>${sensorType}</td>
                        </tr>
                        <tr>
                            <td><strong>Current value</strong></td>
                            <td>${currentValue} ${unit}</td>
                        </tr>
                        <tr>
                            <td><strong>Allowed range</strong></td>
                            <td>${minThreshold} ${unit} - ${maxThreshold} ${unit}</td>
                        </tr>
                    </table>
                    <p>Please check your fridge as soon as possible.</p>
                `;

                return transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);
            })
            .then((result) => {
                resolve(result);
            })
            .catch((error) => {
                reject({
                    message: 'Failed to send alert email.',
                    code: 'emailSendFailed',
                    param: { cause: error.message }
                });
            });
    });
};