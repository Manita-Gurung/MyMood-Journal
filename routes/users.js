const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const db = require('../models');
const { checkNotAuthenticated, ensureAuthenticated } = require('../config/auth');

// Login Page
router.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login', { 
        errors: [],
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg')
    });
});

// Register Page
router.get('/register', (req, res) => {
    res.render('register', { errors: [] });
});

// Register Handle
router.post('/register', async (req, res) => {
    try {
        const { email, password, password2 } = req.body;
        let errors = [];

        // Validation
        if (!email || !password || !password2) {
            errors.push({ msg: 'Please fill in all fields' });
        }

        if (password !== password2) {
            errors.push({ msg: 'Passwords do not match' });
        }

        if (password.length < 6) {
            errors.push({ msg: 'Password should be at least 6 characters' });
        }

        if (errors.length > 0) {
            return res.render('register', {
                errors,
                email
            });
        }

        try {
            // Check if user exists
            const existingUser = await db.User.findOne({ 
                where: { email: email.toLowerCase() } 
            });
            
            if (existingUser) {
                errors.push({ msg: 'Email is already registered' });
                return res.render('register', {
                    errors,
                    email
                });
            }

            // Create new user
            const newUser = await db.User.create({
                email: email.toLowerCase(),
                password: password // Will be hashed by the model's password setter
            });

            // Store user ID in session
            req.session.registrationId = newUser.id;
            
            // Redirect to personal details
            return res.redirect('/users/personal-details');

        } catch (dbError) {
            console.error('Database error:', dbError);
            errors.push({ msg: 'Database error: ' + dbError.message });
            return res.render('register', {
                errors,
                email
            });
        }

    } catch (error) {
        console.error('Registration error:', error);
        return res.render('register', {
            errors: [{ msg: 'An error occurred: ' + error.message }],
            email: req.body.email
        });
    }
});

// Personal Details Page
router.get('/personal-details', (req, res) => {
    // Check if user is in registration process
    if (!req.session.registrationId) {
        req.flash('error_msg', 'Please register first');
        return res.redirect('/users/register');
    }
    res.render('personal-details', { userId: req.session.registrationId });
});

// Handle Personal Details
router.post('/personal-details', async (req, res, next) => {
    const { firstName, lastName, age } = req.body;
    const userId = req.session.registrationId;

    if (!userId) {
        req.flash('error_msg', 'Registration session expired');
        return res.redirect('/users/register');
    }
    
    try {
        const user = await db.User.findByPk(userId);
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/users/register');
        }

        // Update user details
        await user.update({
            first_name: firstName,
            last_name: lastName,
            age: parseInt(age)
        });

        // Clear registration session
        delete req.session.registrationId;

        // Log in the user using Passport
        req.login(user, function(err) {
            if (err) {
                console.error('Login error:', err);
                req.flash('error_msg', 'An error occurred during login');
                return res.redirect('/users/login');
            }
            
            console.log('User logged in successfully after personal details');
            return res.redirect('/dashboard');
        });

    } catch (error) {
        console.error('Personal details error:', error);
        req.flash('error_msg', 'An error occurred while saving your details');
        res.render('personal-details', { 
            userId,
            errors: [{ msg: 'An error occurred while saving your details' }]
        });
    }
});

// Login Handle
router.post('/login', checkNotAuthenticated, (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error('Passport authentication error:', err);
            return next(err);
        }
        
        if (!user) {
            return res.render('login', {
                errors: [{ msg: info.message || 'Invalid email or password' }],
                email: req.body.email,
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });
        }
        
        req.logIn(user, (err) => {
            if (err) {
                console.error('Login error:', err);
                return next(err);
            }
            if (user.isAdmin) {
                // This should ideally not be hit if admins use the /admin/login route,
                // but as a fallback, redirect them to the correct dashboard.
                return res.redirect('/admin/dashboard');
            }
            // Regular user dashboard
            return res.redirect('/dashboard');
        });
    })(req, res, next);
});

// Logout Handle
router.get('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) {
            return next(err);
        }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/users/login');
    });
});

// Forgot Password Page
router.get('/forgot-password', (req, res) => {
    res.render('forgot-password', {
        error_msg: req.flash('error_msg'),
        success_msg: req.flash('success_msg')
    });
});

// Handle Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        console.log('1. Received forgot password request for email:', email);
        
        // Validate email
        if (!email) {
            console.log('2. No email provided');
            req.flash('error_msg', 'Please provide an email address');
            return res.redirect('/users/forgot-password');
        }

        const user = await db.User.findOne({ where: { email } });
        console.log('3. User found:', !!user);

        if (!user) {
            console.log('4. No user found with email:', email);
            req.flash('error_msg', 'No account found with that email address');
            return res.redirect('/users/forgot-password');
        }

        // Generate verification code
        const verificationCode = crypto.randomInt(100000, 999999).toString();
        console.log('5. Generated verification code:', verificationCode);
        
        // Store the code and its expiry time in session
        req.session.resetPassword = {
            email,
            code: verificationCode,
            expiresAt: Date.now() + 30 * 60 * 1000 // 30 minutes
        };
        console.log('6. Session data set:', req.session.resetPassword);

        // Create email transporter
        console.log('7. Setting up email transporter with:', {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS ? '****' : 'not set'
        });

        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            console.log('8. Attempting to send email...');
            
            // Send verification email
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Password Reset Verification Code - MyMood Journal',
                html: `
                    <h1>Password Reset</h1>
                    <p>Your verification code is: <strong>${verificationCode}</strong></p>
                    <p>This code will expire in 30 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                `
            });

            console.log('9. Email sent successfully');
            return res.redirect('/users/verify-code?email=' + encodeURIComponent(email));
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            if (emailError.code === 'EAUTH') {
                req.flash('error_msg', 'Email configuration error. Please contact support.');
            } else {
                req.flash('error_msg', 'Failed to send verification code. Please try again.');
            }
            return res.redirect('/users/forgot-password');
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        req.flash('error_msg', 'An unexpected error occurred. Please try again.');
        return res.redirect('/users/forgot-password');
    }
});

// Add a GET route for verify-code
router.get('/verify-code', (req, res) => {
    const { email } = req.query;
    console.log('Verify code page accessed with email:', email);
    
    // Check if we have an active reset session
    if (!req.session.resetPassword || req.session.resetPassword.email !== email) {
        console.log('No valid reset session found');
        req.flash('error_msg', 'Invalid or expired reset session. Please try again.');
        return res.redirect('/users/forgot-password');
    }

    // Check if the reset session has expired
    if (Date.now() > req.session.resetPassword.expiresAt) {
        console.log('Reset session has expired');
        delete req.session.resetPassword;
        req.flash('error_msg', 'Verification code has expired. Please request a new one.');
        return res.redirect('/users/forgot-password');
    }

    res.render('verify-code', { 
        email,
        error_msg: req.flash('error_msg'),
        success_msg: req.flash('success_msg')
    });
});

// Verify Code POST handler
router.post('/verify-code', (req, res) => {
    const { email, code } = req.body;
    const resetData = req.session.resetPassword;

    if (!resetData || resetData.email !== email || resetData.code !== code || Date.now() > resetData.expiresAt) {
        req.flash('error_msg', 'Invalid or expired verification code');
        return res.redirect('/users/verify-code?email=' + encodeURIComponent(email));
    }

    res.render('reset-password', { email, code });
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, code, password } = req.body;
        const resetData = req.session.resetPassword;

        if (!resetData || resetData.email !== email || resetData.code !== code || Date.now() > resetData.expiresAt) {
            req.flash('error_msg', 'Password reset session expired');
            return res.redirect('/users/forgot-password');
        }

        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/users/forgot-password');
        }

        // Update password
        // The User model's setter (in models/User.js) will automatically hash the password.
        await user.update({ password: password });

        // Clear reset session data
        delete req.session.resetPassword;

        req.flash('success_msg', 'Password has been reset successfully');
        res.redirect('/users/login');
    } catch (error) {
        console.error('Reset password error:', error);
        req.flash('error_msg', 'An error occurred while resetting password');
        res.redirect('/users/forgot-password');
    }
});

// Resend Code
router.get('/resend-code', async (req, res) => {
    try {
        const resetData = req.session.resetPassword;
        if (!resetData || !resetData.email) {
            return res.redirect('/users/forgot-password');
        }

        // Generate new verification code
        const verificationCode = crypto.randomInt(100000, 999999).toString();
        
        // Update session data
        req.session.resetPassword = {
            email: resetData.email,
            code: verificationCode,
            expiresAt: Date.now() + 30 * 60 * 1000
        };

        // Create email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Send verification email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: resetData.email,
            subject: 'Password Reset Verification Code - MyMood Journal',
            html: `
                <h1>Password Reset</h1>
                <p>Your new verification code is: <strong>${verificationCode}</strong></p>
                <p>This code will expire in 30 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        });

        req.flash('success_msg', 'New verification code sent');
        res.render('verify-code', { email: resetData.email });
    } catch (error) {
        console.error('Resend code error:', error);
        req.flash('error_msg', 'An error occurred while resending code');
        res.redirect('/users/forgot-password');
    }
});

// Delete Account Handle
router.post('/delete', ensureAuthenticated, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await db.User.findByPk(userId);

        if (!user) {
            req.flash('error_msg', 'User not found.');
            return res.redirect('/settings'); // Or wherever your settings page is
        }

        await user.destroy(); // This will also delete associated entries due to CASCADE

        req.logout((err) => {
            if (err) {
                console.error('Logout error after account deletion:', err);
                // Even if logout fails, the account is deleted.
                // Decide if you want to redirect to login or show an error.
                // For now, we'll proceed to redirect to landing.
            }
            req.flash('success_msg', 'Your account has been successfully deleted.');
            res.redirect('/'); // Redirect to landing page
        });

    } catch (error) {
        console.error('Delete account error:', error);
        req.flash('error_msg', 'Error deleting account. Please try again.');
        res.redirect('/settings'); // Or back to the page where delete was initiated
    }
});

module.exports = router;