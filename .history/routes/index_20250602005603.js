const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const db = require('../models');

// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => {
    res.render('welcome');
});

// Dashboard
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
    try {
        // Get user data
        const user = await db.User.findByPk(req.user.id, {
            attributes: ['id', 'email', 'first_name', 'last_name']
        });

        if (!user) {
            req.logout((err) => {
                if (err) console.error('Logout error:', err);
                req.flash('error_msg', 'User not found');
                return res.redirect('/users/login');
            });
            return;
        }

        let recentEntries = [];
        let totalEntries = 0;
        let recentActivity = [];

        try {
            // Get recent entries
            recentEntries = await db.Entry.findAll({
                where: { userId: req.user.id },
                order: [['createdAt', 'DESC']],
                limit: 3
            });

            // Get total entries count
            totalEntries = await db.Entry.count({
                where: { userId: req.user.id }
            });

            // Get recent activity
            recentActivity = await db.Entry.findAll({
                where: { userId: req.user.id },
                order: [['createdAt', 'DESC']],
                limit: 3,
                attributes: ['id', 'title', 'createdAt']
            });
        } catch (dbError) {
            console.error('Database error:', dbError);
            // Continue with empty data if there's a database error
        }

        // Get goals data
        let goalsData = {
            completed: 0,
            inProgress: 0,
            completionRate: 0
        };

        try {
            const completedGoals = await db.Goal.count({
                where: { 
                    userId: req.user.id,
                    completed: true
                }
            });

            const inProgressGoals = await db.Goal.count({
                where: { 
                    userId: req.user.id,
                    completed: false
                }
            });

            const totalGoals = completedGoals + inProgressGoals;
            goalsData = {
                completed: completedGoals,
                inProgress: inProgressGoals,
                completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0
            };
        } catch (error) {
            console.error('Error fetching goals:', error);
        }

        // Format user initials
        const userInitials = user.first_name && user.last_name 
            ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
            : user.email.substring(0, 2).toUpperCase();

        res.render('dashboard', {
            user,
            userInitials,
            recentEntries,
            totalEntries,
            goalsData,
            recentActivity
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        req.flash('error_msg', 'Error loading dashboard');
        return res.redirect('/users/login');
    }
});

module.exports = router; 