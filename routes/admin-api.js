const express = require('express');
const router = express.Router();
const { User, Journal, Entry } = require('../models');
const { Op } = require('sequelize');
const { ensureAuthenticated, isAdmin } = require('../middleware/auth');

// Middleware to ensure admin access
router.use(ensureAuthenticated, isAdmin);

// GET /admin/api/dashboard-stats
router.get('/dashboard-stats', async (req, res) => {
    try {
        // Get current date and previous dates for comparison
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const twoWeeksAgo = new Date(weekAgo);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);

        // Get total users count
        const totalUsers = await User.count();
        const previousWeekUsers = await User.count({
            where: {
                createdAt: {
                    [Op.lt]: weekAgo
                }
            }
        });

        // Get active users in last 7 days
        const activeUsers = await User.count({
            include: [{
                model: Entry,
                where: {
                    createdAt: {
                        [Op.gte]: weekAgo
                    }
                },
                required: true
            }]
        });

        // Get active users from previous week for comparison
        const previousWeekActiveUsers = await User.count({
            include: [{
                model: Entry,
                where: {
                    createdAt: {
                        [Op.gte]: twoWeeksAgo,
                        [Op.lt]: weekAgo
                    }
                },
                required: true
            }]
        });

        // Get today's entries count
        const todayEntries = await Entry.count({
            where: {
                createdAt: {
                    [Op.gte]: today
                }
            }
        });

        // Get yesterday's entries count
        const yesterdayEntries = await Entry.count({
            where: {
                createdAt: {
                    [Op.gte]: yesterday,
                    [Op.lt]: today
                }
            }
        });

        res.json({
            totalUsers,
            previousWeekUsers,
            activeUsers,
            previousWeekActiveUsers,
            todayEntries,
            yesterdayEntries,
            lastUpdate: now.toISOString()
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ 
            error: 'Failed to fetch dashboard statistics',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;