const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const db = require('../models');

// Get all journal entries (journals view)
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const journals = await db.Journal.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        const userInitials = req.user.first_name && req.user.last_name
            ? `${req.user.first_name[0]}${req.user.last_name[0]}`.toUpperCase()
            : req.user.email.substring(0, 2).toUpperCase();
        res.render('journals', { journals, userInitials });
    } catch (err) {
        console.error('Error fetching journals:', err);
        req.flash('error_msg', 'Error fetching journals');
        res.redirect('/dashboard');
    }
});


// New journal entry page
router.get('/new', ensureAuthenticated, (req, res) => {
    const userInitials = req.user.first_name && req.user.last_name
        ? `${req.user.first_name[0]}${req.user.last_name[0]}`.toUpperCase()
        : req.user.email.substring(0, 2).toUpperCase();
    res.render('journal-entry', { userInitials });
});

// Create new journal entry
router.post('/create', ensureAuthenticated, async (req, res) => {
    try {
        const { title, content, date, mood } = req.body;
        
        // Validate input
        if (!title || !content) {
            req.flash('error_msg', 'Please fill in all fields');
            return res.redirect('/journals/new');
        }

        // Create journal entry in the correct table
        await db.Journal.create({
            title,
            content,
            date: date || new Date(),
            userId: req.user.id,
            mood
        });

        req.flash('success_msg', 'Journal entry created successfully');
        res.redirect('/journals');
    } catch (error) {
        console.error('Error creating journal:', error);
        req.flash('error_msg', 'Error creating journal entry');
        res.redirect('/journals/new');
    }
});

// Get single journal entry
router.get('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const journal = await db.Journal.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!journal) {
            req.flash('error_msg', 'Journal entry not found');
            return res.redirect('/journals');
        }

        const userInitials = req.user.first_name && req.user.last_name
            ? `${req.user.first_name[0]}${req.user.last_name[0]}`.toUpperCase()
            : req.user.email.substring(0, 2).toUpperCase();
        res.render('journal-view', { journal, userInitials });
    } catch (error) {
        console.error('Error fetching journal:', error);
        req.flash('error_msg', 'Error fetching journal entry');
        res.redirect('/journals');
    }
});

// Delete journal entry
router.delete('/delete/:id', ensureAuthenticated, async (req, res) => {
    try {
        const journal = await db.Journal.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id // Ensure the user owns the journal
            }
        });

        if (!journal) {
            req.flash('error_msg', 'Journal entry not found or you do not have permission to delete it.');
            return res.redirect('/journals');
        }

        await journal.destroy();
        req.flash('success_msg', 'Journal entry deleted successfully');
        res.redirect('/journals');
    } catch (error) {
        console.error('Error deleting journal:', error);
        req.flash('error_msg', 'Error deleting journal entry');
        res.redirect('/journals');
    }
});

// Update journal entry
router.put('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { title, content, mood } = req.body;
        
        // Validate input
        if (!title || !content) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide both title and content' 
            });
        }

        const journal = await db.Journal.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id // Ensure the user owns the journal
            }
        });

        if (!journal) {
            return res.status(404).json({ 
                success: false, 
                message: 'Journal entry not found or you do not have permission to edit it' 
            });
        }

        // Update the journal
        await journal.update({
            title,
            content,
            mood,
            updatedAt: new Date()
        });

        res.json({ 
            success: true, 
            message: 'Journal updated successfully',
            journal: {
                id: journal.id,
                title: journal.title,
                content: journal.content,
                date: journal.date
            }
        });
    } catch (error) {
        console.error('Error updating journal:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating journal entry' 
        });
    }
});

module.exports = router;