const db = require('./models');
require('dotenv').config();

async function verifyUser() {
    try {
        // Get all users
        const users = await db.User.findAll();
        console.log('All registered users:');
        console.log(users.map(user => ({
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            hasPassword: !!user.password
        })));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

verifyUser(); 