const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const db = require('../models');
const { Op } = require('sequelize');

// Helper function to generate calendar data
function generateCalendarData(year, month) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const calendar = [];
    let week = [];
    
    // Add empty days for previous month
    for (let i = 0; i < startingDay; i++) {
        const prevMonthLastDay = new Date(year, month - 1, 0);
        const day = prevMonthLastDay.getDate() - startingDay + i + 1;
        week.push({
            date: new Date(year, month - 2, day).toISOString().split('T')[0],
            dayOfMonth: day,
            isCurrentMonth: false,
            isToday: false
        });
    }
    
    // Add days for current month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const isToday = date.toDateString() === today.toDateString();
        
        week.push({
            date: date.toISOString().split('T')[0],
            dayOfMonth: day,
            isCurrentMonth: true,
            isToday
        });
        
        if (week.length === 7) {
            calendar.push(week);
            week = [];
        }
    }
    
    // Add empty days for next month
    if (week.length > 0) {
        let nextMonthDay = 1;
        while (week.length < 7) {
            week.push({
                date: new Date(year, month, nextMonthDay).toISOString().split('T')[0],
                dayOfMonth: nextMonthDay,
                isCurrentMonth: false,
                isToday: false
            });
            nextMonthDay++;
        }
        calendar.push(week);
    }
    
    return calendar;
}

// Get calendar page
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const today = new Date();
        const currentMonth = today.toLocaleString('default', { month: 'long' });
        const currentYear = today.getFullYear();
        
        // Get initial calendar data
        const calendar = generateCalendarData(currentYear, today.getMonth() + 1);
        
        // Get user's mood entries for the current month
        const startDate = new Date(currentYear, today.getMonth(), 1);
        const endDate = new Date(currentYear, today.getMonth() + 1, 0);
        
        const entries = await db.Entry.findAll({
            where: {
                userId: req.user.id,
                date: {
                    [Op.between]: [startDate, endDate]
                },
                mood: {
                    [Op.not]: null
                }
            },
            attributes: ['date', 'mood']
        });
        
        // Add mood data to calendar
        calendar.forEach(week => {
            week.forEach(day => {
                const entry = entries.find(e => 
                    e.date && e.date.toISOString().split('T')[0] === day.date
                );
                if (entry) {
                    day.mood = entry.mood;
                    day.moodEmoji = getMoodEmoji(entry.mood);
                }
            });
        });
        
        // Calculate mood statistics
        const totalEntries = entries.length;
        let mostFrequentMood = 'Neutral';

        if (entries.length > 0) {
            const moodCounts = entries.reduce((acc, entry) => {
                if (entry.mood) {
                    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
                }
                return acc;
            }, {});
            
            const sortedMoods = Object.entries(moodCounts)
                .sort((a, b) => b[1] - a[1]);
            
            if (sortedMoods.length > 0) {
                mostFrequentMood = sortedMoods[0][0];
            }
        }
        
        res.render('calendar', {
            userInitials: req.user.first_name && req.user.last_name 
                ? `${req.user.first_name[0]}${req.user.last_name[0]}`.toUpperCase()
                : req.user.email.substring(0, 2).toUpperCase(),
            currentMonth,
            currentYear,
            calendar,
            totalEntries,
            mostFrequentMood
        });
    } catch (error) {
        console.error('Error loading calendar:', error);
        req.flash('error', 'Failed to load calendar');
        res.redirect('/dashboard');
    }
});

// Get calendar data for a specific month
router.get('/data', ensureAuthenticated, async (req, res) => {
    try {
        const { month, year } = req.query;
        const calendar = generateCalendarData(parseInt(year), parseInt(month));
        
        // Get user's mood entries for the requested month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const entries = await db.Entry.findAll({
            where: {
                userId: req.user.id,
                date: {
                    [Op.between]: [startDate, endDate]
                },
                mood: {
                    [Op.not]: null
                }
            },
            attributes: ['date', 'mood']
        });
        
        // Add mood data to calendar
        calendar.forEach(week => {
            week.forEach(day => {
                const entry = entries.find(e => 
                    e.date && e.date.toISOString().split('T')[0] === day.date
                );
                if (entry) {
                    day.mood = entry.mood;
                    day.moodEmoji = getMoodEmoji(entry.mood);
                }
            });
        });
        
        // Calculate mood statistics
        const totalEntries = entries.length;
        let mostFrequentMood = 'Neutral';

        if (entries.length > 0) {
            const moodCounts = entries.reduce((acc, entry) => {
                if (entry.mood) {
                    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
                }
                return acc;
            }, {});
            
            const sortedMoods = Object.entries(moodCounts)
                .sort((a, b) => b[1] - a[1]);
            
            if (sortedMoods.length > 0) {
                mostFrequentMood = sortedMoods[0][0];
            }
        }
        
        res.json({
            currentMonth: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
            currentYear: parseInt(year),
            calendar,
            totalEntries,
            mostFrequentMood
        });
    } catch (error) {
        console.error('Error fetching calendar data:', error);
        res.status(500).json({ error: 'Failed to fetch calendar data' });
    }
});

// Update mood for a specific date
router.post('/mood', ensureAuthenticated, async (req, res) => {
    try {
        const { date, mood } = req.body;
        
        if (!date || !mood) {
            req.flash('error', 'Date and mood are required');
            return res.redirect('/calendar');
        }

        // Find or create entry for the date
        const [entry] = await db.Entry.findOrCreate({
            where: {
                userId: req.user.id,
                date: new Date(date)
            },
            defaults: {
                userId: req.user.id,
                content: `Mood: ${mood}`, // Storing mood as content for these specific entries
                mood: mood,
                date: new Date(date),
                fileId: null // Explicitly set fileId to null for mood-only entries
            }
        });
        
        // If the entry was found and its mood is different, or if it's a new entry (already set by defaults)
        if (entry.mood !== mood || entry.isNewRecord) {
            // For existing entries, update mood and content. For new ones, it's already set by defaults.
            if (!entry.isNewRecord) {
                 entry.mood = mood;
                 // Also update content if it's just a mood entry.
                 // If entries can have other content, this logic might need to be more nuanced.
                 entry.content = `Mood: ${mood}`;
            }
            // Ensure userId is set if it's a new record and wasn't part of the where clause uniquely.
            // (Though in this findOrCreate, userId is in the where clause, so this is redundant here but good practice)
            entry.userId = req.user.id;
            await entry.save();
        } else if (entry.isNewRecord) {
            // This case handles if findOrCreate created a new record,
            // it would have used the defaults. We just ensure it's saved if not already.
            // However, findOrCreate saves the record if it creates it and it passes validations.
            // This block might be redundant if findOrCreate guarantees save on creation.
            // For safety, an explicit save if isNewRecord could be here, but typically not needed.
        }
        
        // The original logic for updating an existing entry if mood differs:
        // if (entry.mood !== mood) {
        //     entry.mood = mood;
        //     entry.content = `Mood: ${mood}`;
        //     await entry.save();
        // }
        // The combined logic above handles new and existing.
        
        if (entry.mood !== mood && !entry.isNewRecord) { // Fallback for existing, if above logic is too complex
            entry.mood = mood;
            entry.content = `Mood: ${mood}`;
            await entry.save();
        }
            entry.mood = mood;
            entry.content = `Mood: ${mood}`;
            await entry.save();
        }

        // If it's an AJAX request, send JSON response
        if (req.xhr || req.headers.accept.includes('json')) {
            return res.json({ success: true, mood, moodEmoji: getMoodEmoji(mood) });
        }
        
        // Otherwise redirect back to calendar
        req.flash('success', 'Mood updated successfully');
        return res.redirect('/calendar');
    } catch (error) {
        console.error('Error updating mood:', error);
        if (req.xhr || req.headers.accept.includes('json')) {
            return res.status(500).json({ error: 'Failed to update mood' });
        }
        req.flash('error', 'Failed to update mood');
        return res.redirect('/calendar');
    }
});

// Helper function to get mood emoji
function getMoodEmoji(mood) {
    const moodEmojis = {
        'Happy': '😊',
        'Sad': '😢',
        'Angry': '😠',
        'Neutral': '😐',
        'Calm': '😌'
    };
    return moodEmojis[mood] || '😐';
}

module.exports = router; 