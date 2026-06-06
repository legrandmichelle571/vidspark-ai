const express = require('express');
const { requireAuth } = require('../middleware/auth');
const channelController = require('../controllers/channelController');

const router = express.Router();

router.get('/list', requireAuth, channelController.listChannels);
router.post('/select', requireAuth, channelController.selectChannels);
router.post('/select-business', requireAuth, channelController.selectChannels); // Alias

module.exports = router;
