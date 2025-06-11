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
}); 