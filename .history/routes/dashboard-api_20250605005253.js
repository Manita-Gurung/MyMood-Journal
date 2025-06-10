const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const db = require('../models');

// API endpoint to get recent entries
router.get('/recent-entries', ensureAuthenticated, async (req, res) => {
    try {
        // Get recent entries - exclude title field since it might not exist in the database
        const recentEntries = await db.Entry.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 3,
            attributes: ['id', 'content', 'date', 'mood', 'createdAt', 'updatedAt']
        });

        // Get total entries count
        const totalEntries = await db.Entry.count({
            where: { userId: req.user.id }
        });

        res.json({
            recentEntries,
            totalEntries
        });
    } catch (error) {
        console.error('Error fetching recent entries:', error);
        res.status(500).json({ error: 'Failed to fetch recent entries' });
    }

// API endpoint to get recent activity
router.get('/recent-activity', ensureAuthenticated, async (req, res) => {
    try {
        // Get recent activity
        const recentActivity = await db.Entry.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 3,
            attributes: ['id', 'title', 'createdAt']
        });

        res.json({
            recentActivity
        });
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
});

module.exports = router;
