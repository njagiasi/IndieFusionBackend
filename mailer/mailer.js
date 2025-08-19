const nodemailer = require('nodemailer');

// Create a transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'svsudowindo@gmail.com', // Your Gmail address
        pass: 'dfoelyqscvqjpttz'     // App password (for 2-Step Verification) or Gmail account password (if less secure apps are enabled)
    }
});

// Send mail function
const sendMail = (recipient, subject, text) => {
    const mailOptions = {
        from: 'indie-fusion@info.com', // Sender address
        to: recipient,                // List of recipients
        subject: subject,             // Subject line
        // text: text,                  // Plain text body
        html: text
    };

    // Send mail
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log('Error:', error);
        }
        console.log('Email sent: ' + info.response);
    });
};

module.exports = {
    sendMail
};
