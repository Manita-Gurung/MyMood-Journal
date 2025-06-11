const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const { Folder, File, Entry } = require('../models');
const db = require('../models');

// Get all journal entries (journals view)
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const journals = await db.Journal.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        res.render('journals', { journals });
    } catch (err) {
        console.error('Error fetching journals:', err);
        req.flash('error_msg', 'Error fetching journals');
        res.redirect('/dashboard');
    }
});

// Get files in a folder
router.get('/folder/:id', ensureAuthenticated, async (req, res) => {
    try {
        const folder = await Folder.findOne({
            where: { 
                id: req.params.id,
                userId: req.user.id
            }
        });
        
        if (!folder) {
            req.flash('error_msg', 'Folder not found');
            return res.redirect('/journals');
        }

        const files = await File.findAll({
            where: { folderId: folder.id },
            order: [['createdAt', 'DESC']]
        });

        res.render('entries/new', { folder, files });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error retrieving files');
        res.redirect('/journals');
    }
});

// View a file (journal entry)
router.get('/file/:id', ensureAuthenticated, async (req, res) => {
    try {
        const file = await File.findOne({
            where: { id: req.params.id },
            include: [{
                model: Folder,
                where: { userId: req.user.id }
            }]
        });

        if (!file) {
            req.flash('error_msg', 'File not found');
            return res.redirect('/journals');
        }

        const entry = await Entry.findOne({
            where: { fileId: file.id }
        });

        res.render('entries/edit', { file, entry });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error retrieving entry');
        res.redirect('/journals');
    }
});

// Create new folder
router.post('/new-folder', ensureAuthenticated, async (req, res) => {
    try {
        const { name, color } = req.body;
        await Folder.create({
            name,
            color: color || '#C8BFE7', // Default color if none provided
            userId: req.user.id
        });
        req.flash('success_msg', 'Folder created');
        res.redirect('/journals');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error creating folder');
        res.redirect('/journals');
    }
});

// Create new file in folder
router.post('/folder/:id/new-file', ensureAuthenticated, async (req, res) => {
    try {
        const folder = await Folder.findOne({
            where: { 
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!folder) {
            req.flash('error_msg', 'Folder not found');
            return res.redirect('/journals');
        }

        const { title, content } = req.body;
        const file = await File.create({
            title,
            folderId: folder.id
        });

        await Entry.create({
            content,
            fileId: file.id,
            date: new Date()
        });

        req.flash('success_msg', 'Entry created');
        res.redirect(`/journals/folder/${folder.id}`);
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error creating entry');
        res.redirect(`/journals/folder/${req.params.id}`);
    }
});

// New journal entry page
router.get('/new', ensureAuthenticated, (req, res) => {
    res.render('journal-entry');
});

// Create new journal entry
router.post('/create', ensureAuthenticated, async (req, res) => {
    try {
        const { title, content, date } = req.body;
        
        // Validate input
        if (!title || !content) {
            req.flash('error_msg', 'Please fill in all fields');
            return res.redirect('/journals/new');
        }

        // Create journal entry
        await db.Journal.create({
            title,
            content,
            date: date || new Date(),
            userId: req.user.id
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

        res.render('journal-view', { journal });
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
        req.flash('success_msg', 'Journal entry deleted successfully.');
        res.redirect('/journals');
    } catch (error) {
        console.error('Error deleting journal:', error);
        req.flash('error_msg', 'Error deleting journal entry.');
        res.redirect('/journals');
    }
});
module.exports = router; 