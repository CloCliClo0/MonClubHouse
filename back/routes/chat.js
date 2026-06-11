const express = require('express');
const router = express.Router();
const { getChannels, getMessages, createChannel, sendMessage, manageMembre, renameChannel, muteChannel } = require('../controllers/chatController');
const { authenticate } = require('../middlewares/auth');
const { validateMessage } = require('../middlewares/validation');

router.get('/channels', authenticate, getChannels);
router.post('/channels', authenticate, createChannel);
router.get('/channels/:channelId/messages', authenticate, getMessages);
router.post('/messages', authenticate, validateMessage, sendMessage);

router.patch('/channels/:id/membres', authenticate, manageMembre);
router.patch('/channels/:id/mute', authenticate, muteChannel);
router.patch('/channels/:id', authenticate, renameChannel);

module.exports = router;
