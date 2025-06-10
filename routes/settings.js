const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const db = require('../models');
const { Op } = require('sequelize');

// Get settings page
router.get('/', ensureAuthenticated, (req, res) => {
    // Generate user initials from first_name and last_name
    let userInitials = '';
    if (req.user.first_name && req.user.last_name) {
        userInitials = `${req.user.first_name[0]}${req.user.last_name[0]}`.toUpperCase();
    } else {
        userInitials = req.user.email.substring(0, 2).toUpperCase();
    }

    res.render('settings', {
        user: req.user,
        userInitials: userInitials
    });
});

// Delete account
router.delete('/delete-account', ensureAuthenticated, async (req, res) => {
    console.log('Delete account request received for user:', req.user.id);
    
    try {
        // Start transaction
        const t = await db.sequelize.transaction();

        try {
            console.log('Starting deletion process...');

            // Delete all moods
            console.log('Deleting moods...');
            await db.sequelize.query(
                'DELETE FROM "Moods" WHERE "userId" = ?',
                {
                    replacements: [req.user.id],
                    type: db.sequelize.QueryTypes.DELETE,
                    transaction: t
                }
            );
            console.log('Moods deleted');


            // Delete all goals
            console.log('Deleting goals...');
            await db.sequelize.query(
                'DELETE FROM goals WHERE "userId" = ?',
                {
                    replacements: [req.user.id],
                    type: db.sequelize.QueryTypes.DELETE,
                    transaction: t
                }
            );
            console.log('Goals deleted');


            // Delete the user
            console.log('Deleting user...');
            await db.sequelize.query(
                'DELETE FROM "Users" WHERE id = ?',
                {
                    replacements: [req.user.id],
                    type: db.sequelize.QueryTypes.DELETE,
                    transaction: t
                }
            );
            console.log('User deleted');

            // Commit transaction
            await t.commit();
            console.log('Transaction committed successfully');

            // Clear the session
            req.logout((err) => {
                if (err) {
                    console.error('Error during logout:', err);
                }
                req.flash('success_msg', 'Your account has been successfully deleted');
                res.redirect('/users/login');
            });
        } catch (error) {
            // Rollback transaction on error
            await t.rollback();
            console.error('Error details:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error in delete account process:', error);
        req.flash('error_msg', 'Failed to delete account: ' + error.message);
        res.redirect('/settings');
    }
});

module.exports = router; 