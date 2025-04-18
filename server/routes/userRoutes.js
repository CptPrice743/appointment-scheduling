const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');


// GET My Profile
router.get('/profile/me', protect, async (req, res) => {
    // req.user is populated by 'protect' middleware (excluding password)
    if (!req.user) {
        return res.status(404).json({ message: 'User not found.' });
    }
    // Send back the user object (already excludes password)
    // We might want to populate doctor profile here if needed for a profile page
    const userProfile = await User.findById(req.user.id).select('-password').populate('doctorProfile');
    res.json(userProfile);
});

// UPDATE My Profile (e.g., name, email, maybe phone if added to User model)
router.patch('/profile/me', protect, async (req, res) => {
    const { name, email /*, currentPassword, newPassword, phone */ } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email; // Add validation if email needs to be unique
    // if (phone) updates.phone = phone; // If you add phone to User model

    // Optional: Password Change Logic
    // if (currentPassword && newPassword) {
    //   const user = await User.findById(req.user.id); // Fetch user WITH password field
    //   const isMatch = await bcrypt.compare(currentPassword, user.password);
    //   if (!isMatch) {
    //     return res.status(401).json({ message: 'Incorrect current password' });
    //   }
    //   if (newPassword.length < 6) {
    //      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    //   }
    //   const salt = await bcrypt.genSalt(10);
    //   updates.password = await bcrypt.hash(newPassword, salt);
    // } else if (newPassword && !currentPassword) {
    //    return res.status(400).json({ message: 'Current password required to set a new one.'})
    // }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    try {
        // Find user by ID from token and update allowed fields
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true, context: 'query' } // context: 'query' is important for unique email validation if added
        ).select('-password').populate('doctorProfile'); // Exclude password from response

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // IMPORTANT: If email was changed, consider if JWT needs re-issue or if email uniqueness is enforced
        // Also, update the user info stored in the frontend context/local storage
        // For simplicity here, we just return the updated user.

        res.json(updatedUser);
    } catch (err) {
        console.error("Error updating user profile:", err);
         if (err.code === 11000 && err.keyPattern && err.keyPattern.email) { // Handle unique email error
             return res.status(400).json({ message: 'Email already in use.' });
        }
         if (err.name === 'ValidationError') {
             return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: 'Server error updating profile' });
    }
});


module.exports = router;