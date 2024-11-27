const express = require(`express`)
const session = require("express-session");

const path = require("path")

const app = express()
const port = 1000

require('dotenv').config();

const defaultRoute = require(`./routes/defaultRoute`);
const uploadRoute = require(`./routes/uploadRoute`);

const databaseHandler = require("./handlers/databaseHandler");

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use('/images', express.static('public/images'));
app.set("view engine", "ejs")
app.set('views', path.join(__dirname, 'views'));

app.use(
    session({
        secret: process.env.SECRET, // Change this to a secure key
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, // Set `secure: true` if using HTTPS
    })
);

app.use("/", defaultRoute);
app.use("/", uploadRoute);

app.listen(port, () => {
    console.log("app listening")

    databaseHandler();
})