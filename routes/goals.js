const express = require('express');
const router = express.Router();
const db = require('../models');
const { ensureAuthenticated } = require('../config/auth');

// Get all goals page
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const goals = await db.Goal.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });

        // Generate user initials from first_name and last_name
        const userInitials = req.user.first_name && req.user.last_name 
            ? `${req.user.first_name[0]}${req.user.last_name[0]}`.toUpperCase()
            : req.user.email.substring(0, 2).toUpperCase();

        res.render('goals/index', {
            goals,
            userInitials
        });
    } catch (error) {
        console.error('Error fetching goals:', error);
        req.flash('error', 'Failed to load goals');
        res.redirect('/dashboard');
    }
});

// Create new goal
router.post('/', ensureAuthenticated, async (req, res) => {
    try {
        const { title, description, dueDate } = req.body;
        await db.Goal.create({
            title,
            description,
            dueDate,
            userId: req.user.id,
            completed: false
        });
        
        req.flash('success', 'Goal created successfully');
        res.redirect('/goals');
    } catch (error) {
        console.error('Error creating goal:', error);
        req.flash('error', 'Failed to create goal');
        res.redirect('/goals');
    }
});

// Toggle goal completion
router.post('/:id/toggle', ensureAuthenticated, async (req, res) => {
    try {
        const goal = await db.Goal.findOne({
            where: { 
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!goal) {
            req.flash('error', 'Goal not found');
            return res.redirect('/goals');
        }

        goal.completed = !goal.completed;
        await goal.save();

        // Send JSON response for AJAX requests
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ success: true, completed: goal.completed });
        }

        res.redirect('/goals');
    } catch (error) {
        console.error('Error toggling goal:', error);
        req.flash('error', 'Failed to update goal');
        res.redirect('/goals');
    }
});

// Delete goal
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    try {
        await db.Goal.destroy({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        req.flash('success', 'Goal deleted successfully');
        res.redirect('/goals');
    } catch (error) {
        console.error('Error deleting goal:', error);
        req.flash('error', 'Failed to delete goal');
        res.redirect('/goals');
    }
});

module.exports = router; 