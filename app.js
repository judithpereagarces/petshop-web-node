const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');
const session = require('express-session');
require('dotenv').config();

const app = express();

// ==========================
// CONFIGURACIÓN HANDLEBARS
// ==========================

app.engine('hbs', engine({
    extname: '.hbs',
    helpers: {
        eq: function (a, b) {
            return a === b;
        }
    }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// ==========================
// MIDDLEWARES
// ==========================

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'petshopsecret',
    resave: false,
    saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, 'public')));

// ==========================
// RUTAS
// ==========================

const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

module.exports = app;