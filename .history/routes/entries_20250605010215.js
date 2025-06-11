const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const db = require('../models');

// Get all entries
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const entries = await db.Entry.findAll({
            where: { userId: req.user.id },
            order: [['date', 'DESC']]
        });
        res.render('entries/index', { entries });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error retrieving entries');
        res.redirect('/dashboard');
    }
});

// Get new entry form
router.get('/new', ensureAuthenticated, (req, res) => {
    res.render('entries/new');
});

// Create new entry
router.post('/create', ensureAuthenticated, async (req, res) => {
    try {
        const { title, content, mood } = req.body;
        
        // Create the journal entry
        const entry = await db.Entry.create({
            title,
            content,
            mood,
            userId: req.user.id,
            date: new Date()
        });

        // Check if it's an AJAX request
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ 
                success: true, 
                message: 'Journal entry created successfully',
                entry
            });
        }

        req.flash('success_msg', 'Journal entry created successfully');
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error creating entry:', error);
        
        // Check if it's an AJAX request
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error creating journal entry',
                error: error.message
            });
        }

        req.flash('error_msg', 'Error creating journal entry');
        res.redirect('/entries/new');
    }
});

// Edit entry form
router.get('/edit/:id', ensureAuthenticated, async (req, res) => {
    try {
        const entry = await db.Entry.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });
        if (!entry) {
            req.flash('error_msg', 'Entry not found');
            return res.redirect('/entries');
        }
        res.render('entries/edit', { entry });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error retrieving entry');
        res.redirect('/entries');
    }
});

// Update entry
router.put('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const entry = await db.Entry.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });
        if (!entry) {
            req.flash('error_msg', 'Entry not found');
            return res.redirect('/entries');
        }
        
        await entry.update({
            title: req.body.title,
            content: req.body.content,
            mood: req.body.mood
        });
        
        req.flash('success_msg', 'Entry updated');
        res.redirect('/entries');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error updating entry');
        res.redirect('/entries');
    }
});

// Delete entry
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    try {
        await db.Entry.destroy({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });
        req.flash('success_msg', 'Entry deleted');
        res.redirect('/entries');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error deleting entry');
        res.redirect('/entries');
    }
});

module.exports = router;
