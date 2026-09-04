const { Router } = require('express');
const { getSettings, updateProfile, addAddress } = require('../controllers/profileController');
const { isAuthenticated } = require('../middleware/authMiddleware');

const router = Router();

router.use(isAuthenticated);

router.get('/settings', getSettings);
router.put('/update', updateProfile);
router.post('/address', addAddress);

module.exports = router;
