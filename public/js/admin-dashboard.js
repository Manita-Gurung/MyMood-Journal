// Admin Dashboard JavaScript

// Function to format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Function to calculate percentage change
function calculatePercentageChange(current, previous) {
    if (previous === 0) return 100;
    return ((current - previous) / previous * 100).toFixed(1);
}

// Function to update trend display
function updateTrendDisplay(element, currentValue, previousValue) {
    const percentageChange = calculatePercentageChange(currentValue, previousValue);
    const trendIcon = element.querySelector('.trend-icon');
    const trendValue = element.querySelector('.trend-value');

    if (percentageChange > 0) {
        element.classList.remove('negative');
        element.classList.add('positive');
        trendIcon.textContent = '↑';
        trendValue.textContent = `+${percentageChange}%`;
    } else if (percentageChange < 0) {
        element.classList.remove('positive');
        element.classList.add('negative');
        trendIcon.textContent = '↓';
        trendValue.textContent = `${percentageChange}%`;
    } else {
        element.classList.remove('positive', 'negative');
        trendIcon.textContent = '→';
        trendValue.textContent = '0%';
    }
}

// Function to update dashboard statistics
async function updateDashboardStats() {
    try {
        const response = await fetch('/admin/api/dashboard-stats');
        if (!response.ok) throw new Error('Failed to fetch dashboard stats');
        
        const data = await response.json();

        // Update total users
        document.getElementById('totalUsers').textContent = formatNumber(data.totalUsers);
        updateTrendDisplay(
            document.getElementById('usersTrend'),
            data.totalUsers,
            data.previousWeekUsers
        );

        // Update active users
        document.getElementById('activeUsers').textContent = formatNumber(data.activeUsers);
        updateTrendDisplay(
            document.getElementById('activeUsersTrend'),
            data.activeUsers,
            data.previousWeekActiveUsers
        );

        // Update entries count
        document.getElementById('entriesCount').textContent = formatNumber(data.todayEntries);
        updateTrendDisplay(
            document.getElementById('entriesTrend'),
            data.todayEntries,
            data.yesterdayEntries
        );

        // Update last refresh time
        const now = new Date();
        document.getElementById('lastUpdateTime').textContent = 
            now.toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
            });

    } catch (error) {
        console.error('Error updating dashboard stats:', error);
        // Show error state in UI
        document.querySelectorAll('.stat-number').forEach(el => {
            if (el.textContent === 'Loading...') {
                el.textContent = 'Error';
            }
        });
    }
}

// Function to handle manual refresh
function refreshData() {
    // Show loading state
    document.querySelectorAll('.stat-number').forEach(el => {
        el.textContent = 'Loading...';
    });
    
    // Animate refresh button
    const refreshBtn = document.querySelector('.refresh-btn');
    refreshBtn.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        refreshBtn.style.transform = 'none';
    }, 1000);

    // Update stats
    updateDashboardStats();
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Initial load
    updateDashboardStats();

    // Set up auto-refresh interval (every 5 minutes)
    setInterval(updateDashboardStats, 5 * 60 * 1000);
});