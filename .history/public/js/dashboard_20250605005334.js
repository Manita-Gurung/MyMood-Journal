document.addEventListener('DOMContentLoaded', function() {
    // Add toggle button to sidebar
    const sidebar = document.querySelector('.sidebar');
    const toggleButton = document.createElement('button');
    toggleButton.className = 'sidebar-toggle';
    toggleButton.innerHTML = '<i class="fas fa-angle-double-left"></i>';
    sidebar.appendChild(toggleButton);

    // Toggle sidebar
    toggleButton.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        // Update toggle button icon
        const icon = this.querySelector('i');
        if (sidebar.classList.contains('collapsed')) {
            icon.classList.remove('fa-angle-double-left');
            icon.classList.add('fa-angle-double-right');
        } else {
            icon.classList.remove('fa-angle-double-right');
            icon.classList.add('fa-angle-double-left');
        }
    });

    // Function to update recent entries
    function updateRecentEntries() {
        fetch('/dashboard/api/recent-entries')
            .then(response => response.json())
            .then(data => {
                const entriesList = document.querySelector('.entries-list');
                const totalEntriesElement = document.querySelector('.stat-value:first-child');
                
                if (data.recentEntries && data.recentEntries.length > 0) {
                    let entriesHTML = '';
                    data.recentEntries.forEach(entry => {
                        // Use content preview as title if title is not available
                        const displayTitle = entry.content ? entry.content.substring(0, 30) + '...' : 'Journal Entry';
                        entriesHTML += `
                            <div class="entry-card">
                                <h4>${displayTitle}</h4>
                                <span class="entry-count">${entry.mood || 'No mood'}</span>
                            </div>
                        `;
                    });
                    entriesList.innerHTML = entriesHTML;
                } else {
                    entriesList.innerHTML = `
                        <div class="empty-state">
                            <p>No journal entries yet</p>
                            <a href="/entries/new" class="btn-primary">Create your first entry</a>
                        </div>
                    `;
                }
                
                // Update total entries count
                if (totalEntriesElement) {
                    totalEntriesElement.textContent = data.totalEntries;
                }
            })
            .catch(error => {
                console.error('Error fetching recent entries:', error);
            });
    // Function to update recent activity
    function updateRecentActivity() {
        fetch('/dashboard/api/recent-activity')
            .then(response => response.json())
            .then(data => {
                const activityList = document.querySelector('.activity-list');
                
                if (data.recentActivity && data.recentActivity.length > 0) {
                    let activityHTML = '';
                    data.recentActivity.forEach(activity => {
                        activityHTML += `
                            <div class="activity-item">
                                <span class="activity-title">${activity.title}</span>
                                <span class="activity-time">
                                    ${new Date(activity.createdAt).toLocaleString()}
                                </span>
                            </div>
                        `;
                    });
                    activityList.innerHTML = activityHTML;
                } else {
                    activityList.innerHTML = '<p>No recent activity</p>';
                }
            })
            .catch(error => {
                console.error('Error fetching recent activity:', error);
            });
    }

    // Initial update
    updateRecentEntries();
    updateRecentActivity();

    // Set up periodic updates (every 30 seconds)
    setInterval(() => {
        updateRecentEntries();
        updateRecentActivity();
    }, 30000);
});
