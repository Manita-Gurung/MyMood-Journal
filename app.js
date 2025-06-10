const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const methodOverride = require('method-override');
require('dotenv').config();

const app = express();

// Database
const db = require('./models');

// Passport config
require('./config/passport')(passport);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: false, // Set to false for development
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Flash messages
app.use(flash());

// Global variables
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
});

// Routes
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const journalsRouter = require('./routes/journals');
const goalsRouter = require('./routes/goals');
const calendarRouter = require('./routes/calendar');
const settingsRouter = require('./routes/settings');
const profileRouter = require('./routes/profile');
const adminRouter = require('./routes/admin');
const adminApiRouter = require('./routes/admin-api');
const adminUsersApiRouter = require('./routes/admin-users-api');
const dashboardApiRouter = require('./routes/dashboard-api');

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/journals', journalsRouter);
app.use('/goals', goalsRouter);
app.use('/calendar', calendarRouter);
app.use('/settings', settingsRouter);
app.use('/profile', profileRouter);
app.use('/admin', adminRouter);
app.use('/admin/api', adminApiRouter);
app.use('/admin/api/users', adminUsersApiRouter);
app.use('/dashboard/api', dashboardApiRouter);

const PORT = process.env.PORT || 5000;

// Sync database and start server
db.sequelize.sync()
    .then(() => {
        app.listen(PORT, () => {
            console.log('\x1b[36m%s\x1b[0m', `Server is running on port ${PORT}`);
            console.log('\x1b[36m%s\x1b[0m', `➜ Local:   http://localhost:${PORT}`);
            console.log('\x1b[36m%s\x1b[0m', `➜ Network: http://${getLocalIpAddress()}:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

// Helper function to get local IP address
function getLocalIpAddress() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost'; // Fallback to localhost if no network interface is found
}
