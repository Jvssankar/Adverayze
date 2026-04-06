const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// GET all messages (excluding deleted-for-everyone)
router.get('/', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'username query param required' });

    const messages = await Message.find({ deletedForEveryone: false })
      .sort({ createdAt: 1 })
      .limit(200);

    // Filter out messages this user deleted for themselves
    const filtered = messages.filter(msg => !msg.deletedFor.includes(username));
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST send a message
router.post('/', async (req, res) => {
  try {
    const { username, content } = req.body;
    if (!username || !content) return res.status(400).json({ error: 'username and content are required' });
    if (content.trim().length === 0) return res.status(400).json({ error: 'Content cannot be empty' });

    const message = new Message({ username: username.trim(), content: content.trim() });
    await message.save();

    // Emit to all connected clients via Socket.io
    req.io.emit('newMessage', message);
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE for me
router.delete('/:id/me', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'username required' });

    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { deletedFor: username } },
      { new: true }
    );
    if (!message) return res.status(404).json({ error: 'Message not found' });

    req.io.emit('messageDeletedForMe', { messageId: req.params.id, username });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE for everyone
router.delete('/:id/everyone', async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { deletedForEveryone: true },
      { new: true }
    );
    if (!message) return res.status(404).json({ error: 'Message not found' });

    req.io.emit('messageDeletedForEveryone', { messageId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH pin/unpin
router.patch('/:id/pin', async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    message.isPinned = !message.isPinned;
    await message.save();

    req.io.emit('messagePinToggled', { messageId: req.params.id, isPinned: message.isPinned });
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;