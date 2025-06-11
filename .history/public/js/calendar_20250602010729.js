let currentDate = new Date();

// Function to update the calendar
function updateCalendar() {
    fetch(`/calendar/data?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('currentMonth').textContent = `${data.currentMonth} ${data.currentYear}`;
            
            const calendarDays = document.getElementById('calendarDays');
            calendarDays.innerHTML = '';

            data.calendar.forEach(week => {
                week.forEach(day => {
                    const dayElement = document.createElement('div');
                    dayElement.className = `day ${day.isCurrentMonth ? '' : 'other-month'} ${day.isToday ? 'today' : ''}`;
                    dayElement.setAttribute('data-date', day.date);

                    const dateNumber = document.createElement('span');
                    dateNumber.className = 'date-number';
                    dateNumber.textContent = day.dayOfMonth;
                    dayElement.appendChild(dateNumber);

                    if (day.mood) {
                        const moodIndicator = document.createElement('div');
                        moodIndicator.className = `mood-indicator ${day.mood.toLowerCase()}`;
                        moodIndicator.textContent = day.moodEmoji;
                        dayElement.appendChild(moodIndicator);
                    }

                    dayElement.addEventListener('click', () => showMoodSelector(day.date));
                    calendarDays.appendChild(dayElement);
                });
            });

            // Update mood insights
            document.querySelector('.total-entries').textContent = `Total Entries: ${data.totalEntries}`;
            const mostFrequentMood = document.querySelector('.most-frequent .mood-indicator');
            if (data.mostFrequentMood) {
                mostFrequentMood.className = `mood-indicator ${data.mostFrequentMood.toLowerCase()}`;
                mostFrequentMood.textContent = data.mostFrequentMood;
            }
        })
        .catch(error => {
            console.error('Error fetching calendar data:', error);
        });
}

// Navigate to previous month
function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar();
}

// Navigate to next month
function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar();
}

// Show mood selector for a specific date
function showMoodSelector(date) {
    // Create a form to submit the mood
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/calendar/mood';

    const dateInput = document.createElement('input');
    dateInput.type = 'hidden';
    dateInput.name = 'date';
    dateInput.value = date;

    const moodInput = document.createElement('input');
    moodInput.type = 'hidden';
    moodInput.name = 'mood';

    form.appendChild(dateInput);
    form.appendChild(moodInput);

    // Create mood selector dialog
    const moods = [
        { name: 'Happy', emoji: '😊' },
        { name: 'Sad', emoji: '😢' },
        { name: 'Angry', emoji: '😠' },
        { name: 'Neutral', emoji: '😐' },
        { name: 'Calm', emoji: '😌' }
    ];

    const dialog = document.createElement('div');
    dialog.className = 'mood-selector';
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
    `;

    const title = document.createElement('h3');
    title.textContent = `Select mood for ${new Date(date).toLocaleDateString()}`;
    dialog.appendChild(title);

    const moodGrid = document.createElement('div');
    moodGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 10px;
        margin-top: 15px;
    `;

    moods.forEach(mood => {
        const moodButton = document.createElement('button');
        moodButton.type = 'button';
        moodButton.className = `mood-button ${mood.name.toLowerCase()}`;
        moodButton.textContent = mood.emoji;
        moodButton.style.cssText = `
            padding: 10px;
            font-size: 24px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: transform 0.2s;
        `;
        moodButton.addEventListener('mouseover', () => {
            moodButton.style.transform = 'scale(1.1)';
        });
        moodButton.addEventListener('mouseout', () => {
            moodButton.style.transform = 'scale(1)';
        });
        moodButton.onclick = () => {
            moodInput.value = mood.name;
            form.submit();
            document.body.removeChild(overlay);
            document.body.removeChild(dialog);
        };
        moodGrid.appendChild(moodButton);
    });

    dialog.appendChild(moodGrid);

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        border: none;
        background: none;
        font-size: 20px;
        cursor: pointer;
        color: #666;
    `;
    closeButton.onclick = () => {
        document.body.removeChild(overlay);
        document.body.removeChild(dialog);
    };
    dialog.appendChild(closeButton);

    // Add overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 999;
    `;
    overlay.onclick = () => {
        document.body.removeChild(overlay);
        document.body.removeChild(dialog);
    };

    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
}

// Initialize calendar
document.addEventListener('DOMContentLoaded', () => {
    updateCalendar();
}); 