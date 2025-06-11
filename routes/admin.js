const express = require('express');
const router = express.Router();
const passport = require('passport');
const { checkNotAuthenticated, ensureAuthenticated, isAdmin } = require('../middleware/auth');
<<<<<<< HEAD
const { User, Journal } = require('../models');
=======
const { User, Entry } = require('../models');
>>>>>>> 4557a295b2d52c655573d57ab0d421088e3b2fdb
const { Op, Sequelize } = require('sequelize');

// Admin Login Page
router.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('admin-login', {
        errors: [],
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg')
    });
});

// Admin Login Handle
router.post('/login', checkNotAuthenticated, (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        console.log('[POST /admin/login] Passport authenticate callback. Error:', err, 'User:', user ? {id: user.id, isAdmin: user.isAdmin} : null);
        if (err) {
            console.log('[POST /admin/login] Passport error:', err);
            return next(err);
        }
        if (!user) {
            console.log('[POST /admin/login] No user returned from Passport. Info:', info);
            req.flash('error_msg', (info && info.message) || 'Invalid email or password');
            return res.redirect('/admin/login');
        }
        if (!user.isAdmin) {
            console.log('[POST /admin/login] User is not an admin. User:', {id: user.id, isAdmin: user.isAdmin});
            req.flash('error_msg', 'Access denied. Admin privileges required.');
            return res.redirect('/admin/login');
        }
        req.logIn(user, (err) => {
            console.log('[POST /admin/login] req.logIn callback. Error:', err);
            if (err) {
                console.log('[POST /admin/login] Error in req.logIn:', err);
                return next(err);
            }
            console.log('[POST /admin/login] SUCCESSFUL ADMIN LOGIN. Redirecting to /admin/dashboard. User in session:', req.user ? {id: req.user.id, isAdmin: req.user.isAdmin} : null);
            return res.redirect('/admin/dashboard');
        });
    })(req, res, next);
});

// Admin Dashboard
router.get('/dashboard', ensureAuthenticated, isAdmin, async (req, res) => {
    try {
        // --- Statistics --- 
        const totalUsers = await User.count();

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const activeUsersLast7Days = await User.count({
            where: { updatedAt: { [Op.gte]: oneWeekAgo } }
        });

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
<<<<<<< HEAD
        const entriesToday = await Journal.count({ where: { createdAt: { [Op.gte]: todayStart } } });
=======
        const entriesToday = await Entry.count({ where: { createdAt: { [Op.gte]: todayStart } } });
>>>>>>> 4557a295b2d52c655573d57ab0d421088e3b2fdb
        
        // Placeholder for growth/retention - requires more historical data logic
        const userGrowthPercentage = 12.5; // Example
        const activeUsersRetention = 78.2; // Example
<<<<<<< HEAD
        const avgEntriesPerUser = totalUsers > 0 ? (await Journal.count() / totalUsers).toFixed(1) : 0;
=======
        const avgEntriesPerUser = totalUsers > 0 ? (await Entry.count() / totalUsers).toFixed(1) : 0;
>>>>>>> 4557a295b2d52c655573d57ab0d421088e3b2fdb

        // --- User Management Table --- 
        const page = parseInt(req.query.page) || 1;
        const limit = 5; // Show 5 users per page as in the image
        const offset = (page - 1) * limit;

        // Filters
        const whereClause = {};
        if (req.query.search) {
            const searchTerm = `%${req.query.search}%`;
            whereClause[Op.or] = [
                { first_name: { [Op.iLike]: searchTerm } },
                { last_name: { [Op.iLike]: searchTerm } },
                { email: { [Op.iLike]: searchTerm } }
            ];
        }
        if (req.query.status && req.query.status !== 'all') {
            if (req.query.status === 'admin') whereClause.isAdmin = true;
            // Removed isActive filters as the column doesn't exist
        }
        // Add dateJoined filter logic if implementing fully
        // Example: if (req.query.dateJoined === 'today') whereClause.createdAt = { [Op.gte]: todayStart };

        const { count, rows: users } = await User.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'email', 'createdAt', 'updatedAt', 'isAdmin', 'first_name', 'last_name'], // Fetch first_name, last_name
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        const totalPages = Math.ceil(count / limit);
        const startIndex = offset;
        const endIndex = Math.min(offset + limit, count);

<<<<<<< HEAD
        res.render('admin/admindashboard', {
            user: req.user, // Logged in admin user
            userInitials: req.user.first_name && req.user.last_name
                ? `${req.user.first_name[0]}${req.user.last_name[0]}`.toUpperCase()
                : req.user.email.substring(0, 2).toUpperCase(),
=======
        res.render('admin/dashboard', {
            user: req.user, // Logged in admin user
>>>>>>> 4557a295b2d52c655573d57ab0d421088e3b2fdb
            stats: {
                totalUsers,
                activeUsers: activeUsersLast7Days,
                entriesToday,
                userGrowthPercentage,
                activeUsersRetention,
                avgEntriesPerUser
            },
            users: users.map(u => ({
                id: u.id,
                username: `${u.first_name || ''} ${u.last_name || ''}`.trim(), // Construct username
                email: u.email,
                createdAt: u.createdAt,
                isAdmin: u.isAdmin,
                // isActive is not reliably available, default for display purposes or remove from template
                isActive: true, // Or determine based on other logic if needed, for now, assume active if not admin
                updatedAt: u.updatedAt
            })),
            pagination: {
                currentPage: page,
                totalPages,
                totalUsers: count,
                startIndex,
                endIndex
            },
            query: req.query, // Pass query params for filters to persist in UI if needed
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
        });

    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        req.flash('error_msg', 'Error loading dashboard data');
        res.redirect('/'); // Or an error page
    }
});

// Admin Users Management Page (Old - can be removed or repurposed if /admin/users is now part of dashboard)
// router.get('/users', ensureAuthenticated, isAdmin, async (req, res) => { ... });

// Admin Reset Password Page
router.get('/reset-password', ensureAuthenticated, isAdmin, (req, res) => {
    res.render('admin-reset-password', {
        user: req.user,
        errors: [],
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg')
    });
});

// Admin Logout Handle
router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { 
            console.error('Admin logout error:', err);
            return next(err); 
        }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/admin/login');
    });
});

module.exports = router;