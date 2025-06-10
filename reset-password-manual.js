const db = require('./models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetPassword() {
    try {
        const email = '07230042.sherubtse@rub.edu.bt';
        const newPassword = 'Password123!'; // This will be the temporary password

        // Find the user
        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            console.error('User not found');
            process.exit(1);
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the password
        await user.update({ password: hashedPassword });

        console.log('Password has been reset successfully!');
        console.log('New password:', newPassword);
        console.log('Please login with these credentials and change your password afterwards.');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting password:', error);
        process.exit(1);
    }
}

resetPassword(); 