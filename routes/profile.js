const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const db = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// @route   GET /profile
// @desc    Get user profile page
// @access  Private
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        // The ensureAuthenticated middleware already attaches the user to req.user
        // The user object should ideally have: id, username, email, createdAt, first_name, last_name
        // The new design uses username, or a combination of first_name and last_name if username is not present.
        // It also uses email and createdAt.

        const user = req.user;

        // Ensure user data is available and has the necessary fields
        if (!user || !user.email || !user.createdAt) {
            console.error('Profile Route: User data is incomplete or missing.', user);
            req.flash('error_msg', 'Could not load profile. User data is incomplete.');
            return res.redirect('/dashboard'); // Redirect to a safe page
        }

        // Construct the full name if username is not directly available
        // This depends on your User model structure.
        // If user.username exists, it's preferred.
        // Otherwise, combine first_name and last_name.
        const displayName = user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim();

        res.render('profile', {
            user: {
                id: user.id,
                username: displayName,
                first_name: user.first_name, // Keep for flexibility if needed by <%= user.first_name + ' ' + user.last_name %>
                last_name: user.last_name,   // Keep for flexibility
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Error in profile route:', error);
        req.flash('error_msg', 'Error loading profile page.');
        // It's good practice to render an error page or redirect with a message
        // For simplicity, redirecting to dashboard here.
        res.redirect('/dashboard'); 
    }
});

module.exports = router; 