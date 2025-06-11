const LocalStrategy = require('passport-local').Strategy;
const db = require('../models');

module.exports = function(passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
            try {
                // Find user by email
                let user = await db.User.findOne({
                    where: { email: email.toLowerCase() }
                });
                
                // If user not found, check admin
                if (!user) {
                    user = await db.Admin.findOne({
                        where: { email: email.toLowerCase() }
                    });
                }

                if (!user) {
                    return done(null, false, { message: 'Email is not registered' });
                }

                // Check password
                if (user.checkPassword(password)) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Password is incorrect' });
                }
            } catch (err) {
                return done(err);
            }
        })
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await db.User.findByPk(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
}; 