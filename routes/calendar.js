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
        const currentMonthName = today.toLocaleString('default', { month: 'long' }); // Renamed to avoid conflict
        const currentYear = today.getFullYear();
        
        // Get initial calendar data
        const calendarData = generateCalendarData(currentYear, today.getMonth() + 1); // Renamed
        
        // Get user's mood entries for the current month
        const startDate = new Date(currentYear, today.getMonth(), 1);
        const endDate = new Date(currentYear, today.getMonth() + 1, 0);
        
        const entries = await db.Journal.findAll({
            where: {
                userId: req.user.id,
                date: {
                    [Op.between]: [startDate, endDate]
                }
            },
            attributes: ['date', 'mood']
        });
        
        // Add mood data to calendar
        calendarData.forEach(week => {
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
            currentMonth: currentMonthName, // Use renamed variable
            currentYear,
            calendar: calendarData, // Use renamed variable
            totalEntries,
            mostFrequentMood
        });
    } catch (error) {
        console.error('Error loading calendar:', error);
        req.flash('error', 'Failed to load calendar');
        res.redirect('/calendar');
    }
});

// Get calendar data for a specific month
router.get('/data', ensureAuthenticated, async (req, res) => {
    try {
        const { month, year } = req.query;
        const monthInt = parseInt(month);
        const yearInt = parseInt(year);
        const calendarData = generateCalendarData(yearInt, monthInt); // Renamed
        
        // Get user's mood entries for the requested month
        const startDate = new Date(yearInt, monthInt - 1, 1);
        const endDate = new Date(yearInt, monthInt, 0);
        
        const entries = await db.Journal.findAll({
            where: {
                userId: req.user.id,
                date: {
                    [Op.between]: [startDate, endDate]
                }
            },
            attributes: ['date', 'mood']
        });
        
        // Add mood data to calendar
        calendarData.forEach(week => {
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
            currentMonth: new Date(yearInt, monthInt - 1).toLocaleString('default', { month: 'long' }),
            currentYear: yearInt,
            calendar: calendarData, // Use renamed variable
            totalEntries,
            mostFrequentMood
        });
    } catch (error) {
        console.error('Error fetching calendar data:', error);
        res.status(500).json({ error: 'Failed to fetch calendar data' });
    }
});

// Get all moods for the user
router.get('/moods', ensureAuthenticated, async (req, res) => {
    try {
        const moods = await db.Mood.findAll({
            where: { userId: req.user.id }
        });

        // Convert to format expected by frontend
        const moodMap = {};
        moods.forEach(mood => {
            moodMap[mood.date] = {
                mood: mood.mood,
                emoji: mood.emoji
            };
        });

        res.json(moodMap);
    } catch (error) {
        console.error('Error fetching moods:', error);
        res.status(500).json({ error: 'Error fetching moods' });
    }
});

// Save mood for a date
router.post('/mood', ensureAuthenticated, async (req, res) => {
    try {
        const { date, mood, emoji } = req.body;

        // Validate input
        if (!date || !mood || !emoji) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Update or create mood entry
        const [moodEntry] = await db.Mood.findOrCreate({
            where: {
                userId: req.user.id,
                date: date
            },
            defaults: {
                mood,
                emoji,
                userId: req.user.id
            }
        });

        if (moodEntry) {
            moodEntry.mood = mood;
            moodEntry.emoji = emoji;
            await moodEntry.save();
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving mood:', error);
        res.status(500).json({ error: 'Error saving mood' });
    }
});

// Helper function to get mood emoji
function getMoodEmoji(mood) {
    const moodEmojis = {
        'Happy': '😊',
        'Excited': '🤗',
        'Loved': '🥰',
        'Calm': '😌',
        'Okay': '😐',
        'Sad': '😢',
        'Angry': '😠',
        'Stressed': '😫'
    };
    return moodEmojis[mood] || '😐'; // Default to Neutral if mood not found
}

module.exports = router;