const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { Op } = require('sequelize');
const { ensureAuthenticated, isAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Middleware to ensure admin access
router.use(ensureAuthenticated, isAdmin);

// GET /admin/api/users/:id - This route must come before other GET routes to avoid conflicts
router.get('/:id', async (req, res) => {
    try {
        console.log('Fetching user with ID:', req.params.id); // Debug log
        const user = await User.findByPk(req.params.id, {
            attributes: ['id', 'username', 'email', 'createdAt', 'updatedAt', 'isAdmin']
        });

        if (!user) {
            console.log('User not found'); // Debug log
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            status: user.isAdmin ? 'Admin' : 'Active',
            createdAt: user.createdAt,
            lastActive: user.updatedAt
        };
        console.log('Sending user data:', userData); // Debug log
        res.json(userData);

    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});

// GET /admin/api/users
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await User.findAndCountAll({
            attributes: ['id', 'username', 'email', 'createdAt', 'updatedAt', 'isAdmin'],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        // Calculate pagination info
        const totalPages = Math.ceil(count / limit);
        const startIndex = offset;
        const endIndex = Math.min(startIndex + limit, count);

        // Format user data
        const users = rows.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            status: user.isAdmin ? 'Admin' : 'Active',
            createdAt: user.createdAt,
            lastActive: user.updatedAt,
        }));

        res.json({
            users,
            pagination: {
                currentPage: page,
                totalPages,
                startIndex,
                endIndex,
                totalUsers: count
            }
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// GET /admin/api/users/filter
router.get('/filter', async (req, res) => {
    try {
        const { search, status } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Build where clause
        const whereClause = {};
        if (search) {
            whereClause[Op.or] = [
                { username: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } }
            ];
        }
        if (status && status !== 'all') {
            whereClause.isAdmin = status === 'admin';
        }

        const { count, rows } = await User.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'username', 'email', 'createdAt', 'updatedAt', 'isAdmin'],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        // Calculate pagination info
        const totalPages = Math.ceil(count / limit);
        const startIndex = offset;
        const endIndex = Math.min(startIndex + limit, count);

        // Format user data
        const users = rows.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            status: user.isAdmin ? 'Admin' : 'Active',
            createdAt: user.createdAt,
            lastActive: user.updatedAt,
        }));

        res.json({
            users,
            pagination: {
                currentPage: page,
                totalPages,
                startIndex,
                endIndex,
                totalUsers: count
            }
        });

    } catch (error) {
        console.error('Error filtering users:', error);
        res.status(500).json({ error: 'Failed to filter users' });
    }
});

// GET /admin/api/users/sort
router.get('/sort', async (req, res) => {
    try {
        const { sortBy } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        let order = [];
        switch (sortBy) {
            case 'date-joined':
                order = [['createdAt', 'DESC']];
                break;
            case 'last-active':
                order = [['updatedAt', 'DESC']];
                break;
            default:
                order = [['createdAt', 'DESC']];
        }

        const { count, rows } = await User.findAndCountAll({
            attributes: ['id', 'username', 'email', 'createdAt', 'updatedAt', 'isAdmin'],
            limit,
            offset,
            order
        });

        // Format user data
        const users = rows.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            status: user.isAdmin ? 'Admin' : 'Active',
            createdAt: user.createdAt,
            lastActive: user.updatedAt,
        }));

        res.json({ users });

    } catch (error) {
        console.error('Error sorting users:', error);
        res.status(500).json({ error: 'Failed to sort users' });
    }
});

// POST /admin/api/users/:id/reset-password
router.post('/:id/reset-password', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Update user password
        await user.update({ password: hashedPassword });

        // Send email with temporary password
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset - MyMood Journal',
            html: `
                <h1>Password Reset</h1>
                <p>Your password has been reset by an administrator.</p>
                <p>Your temporary password is: <strong>${tempPassword}</strong></p>
                <p>Please log in and change your password immediately.</p>
            `
        });

        res.json({ message: 'Password reset successful' });

    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// POST /admin/api/users/:id/toggle-status
router.post('/:id/toggle-status', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Toggle user status (active/inactive)
        const newStatus = user.isAdmin ? false : true;
        await user.update({ isAdmin: newStatus });

        res.json({
            status: newStatus ? 'Admin' : 'Active',
            message: 'User status updated successfully'
        });

    } catch (error) {
        console.error('Error toggling user status:', error);
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

// DELETE /admin/api/users/:id
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent deleting super admin
        if (user.email === process.env.ADMIN_EMAIL) {
            return res.status(403).json({ error: 'Cannot delete super admin' });
        }

        await user.destroy();
        res.json({ message: 'User deleted successfully' });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// PUT /admin/api/users/:id
router.put('/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent modifying super admin
        if (user.email === process.env.ADMIN_EMAIL) {
            return res.status(403).json({ error: 'Cannot modify super admin' });
        }

        const { username, email, status } = req.body;
        
        // Update user details
        await user.update({
            username: username,
            email: email,
            isAdmin: status === 'admin'
        });

        res.json({
            message: 'User updated successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                status: user.isAdmin ? 'Admin' : 'Active',
                createdAt: user.createdAt,
                lastActive: user.updatedAt
            }
        });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

module.exports = router;