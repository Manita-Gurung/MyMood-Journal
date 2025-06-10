const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const Entry = require('../models/Entry');
const db = require('../models');

// Get all entries
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const entries = await Entry.find({ user: req.user.id }).sort({ date: -1 });
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
        const entry = await Entry.findOne({
            _id: req.params.id,
            user: req.user.id
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
        const entry = await Entry.findOne({
            _id: req.params.id,
            user: req.user.id
        });
        if (!entry) {
            req.flash('error_msg', 'Entry not found');
            return res.redirect('/entries');
        }
        
        entry.title = req.body.title;
        entry.content = req.body.content;
        entry.mood = req.body.mood;
        
        await entry.save();
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
        await Entry.deleteOne({
            _id: req.params.id,
            user: req.user.id
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
