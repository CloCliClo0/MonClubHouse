const express = require('express');
const router = express.Router();
const { getChannels, getMessages, createChannel, sendMessage } = require('../controllers/chatController');
const { authenticate } = require('../middlewares/auth');
const { validateMessage } = require('../middlewares/validation');

router.get('/channels', authenticate, getChannels);
router.post('/channels', authenticate, createChannel);
router.get('/channels/:channelId/messages', authenticate, getMessages);
router.post('/messages', authenticate, validateMessage, sendMessage);

module.exports = router;
