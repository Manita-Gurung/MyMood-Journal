module.exports = {
    ensureAuthenticated: function(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        req.flash('error_msg', 'Please log in to view this resource');
        res.redirect('/users/login');
    },
    checkNotAuthenticated: function(req, res, next) {
        console.log('[checkNotAuthenticated] Path:', req.path);
        console.log('[checkNotAuthenticated] User Authenticated?', req.isAuthenticated());
        if (req.isAuthenticated()) {
            console.log('[checkNotAuthenticated] User object:', req.user ? { id: req.user.id, isAdmin: req.user.isAdmin } : null);
            if (req.user && req.user.isAdmin) {
                console.log('[checkNotAuthenticated] Authenticated ADMIN. Redirecting to /admin/dashboard.');
                return res.redirect('/admin/dashboard');
            } else {
                console.log('[checkNotAuthenticated] Authenticated NON-ADMIN or isAdmin flag missing. Redirecting to /dashboard.');
                return res.redirect('/dashboard');
            }
        }
        console.log('[checkNotAuthenticated] Not authenticated. Calling next().');
        return next();
    },
    isAdmin: function(req, res, next) {
        console.log('[isAdmin] Check: User Authenticated?', req.isAuthenticated(), 'Is Admin?', req.user ? req.user.isAdmin : 'No user');
        if (req.isAuthenticated() && req.user && req.user.isAdmin) {
            console.log('[isAdmin] Access granted.');
            return next();
        }
        req.flash('error_msg', 'Access denied. Admin privileges required.');
        console.log('[isAdmin] Access denied. Redirecting to /dashboard.');
        res.redirect('/admin/login');
    }
};