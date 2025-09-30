const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');

const router = express.Router();

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { receiver, receiverRole, message } = req.body;
    const sender = req.user._id;
    const senderRole = req.user.isPractitioner ? 'practitioner' : 'user';

    const newMessage = new Message({
      sender,
      senderRole,
      receiver,
      receiverRole,
      message,
    });

    await newMessage.save();

    res.status(201).json({ ok: true, message: newMessage });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// Get messages between current user and another user
router.get('/:otherUserId', auth, async (req, res) => {
  try {
    const otherUserId = req.params.otherUserId;
    const currentUserId = req.user._id;
    const isPractitioner = req.user.isPractitioner;

    let senderRole, receiverRole;
    if (!isPractitioner) {
      senderRole = 'user';
      receiverRole = 'practitioner';
    } else {
      senderRole = 'practitioner';
      receiverRole = 'user';
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, senderRole, receiver: otherUserId, receiverRole },
        { sender: otherUserId, senderRole: receiverRole, receiver: currentUserId, receiverRole: senderRole },
      ],
    }).sort({ timestamp: 1 });

    res.json({ ok: true, messages });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// Mark messages as read
router.put('/mark-read/:otherUserId', auth, async (req, res) => {
  try {
    const otherUserId = req.params.otherUserId;
    const currentUserId = req.user._id;
    const isPractitioner = req.user.isPractitioner;

    let senderRole, receiverRole;
    if (!isPractitioner) {
      senderRole = 'practitioner';
      receiverRole = 'user';
    } else {
      senderRole = 'user';
      receiverRole = 'practitioner';
    }

    await Message.updateMany(
      { sender: otherUserId, senderRole, receiver: currentUserId, receiverRole, read: false },
      { read: true }
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Error marking messages as read:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// For practitioners: Get list of users they've chatted with or have approved bookings
router.get('/practitioner/users', auth, async (req, res) => {
  try {
    if (!req.user.isPractitioner) {
      return res.status(403).json({ ok: false, message: 'Access denied' });
    }

    const practitionerId = req.user._id;

    const bookings = await Booking.find({
      practitioner: practitionerId,
      status: 'approved',
    }).populate('user', '_id name mobile');

    const bookingUsers = bookings.map(booking => ({
      user: booking.user,
      lastMessage: null,
      unreadCount: 0,
      hasBooking: true,
    }));

    const userMessages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: practitionerId, senderRole: 'practitioner' },
            { receiver: practitionerId, receiverRole: 'practitioner' },
          ],
        },
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$senderRole', 'user'] },
              then: '$sender',
              else: '$receiver',
            },
          },
          lastMessage: { $last: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ['$receiver', practitionerId] },
                    { $eq: ['$receiverRole', 'practitioner'] },
                    { $eq: ['$read', false] },
                  ],
                },
                then: 1,
                else: 0,
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          user: { _id: 1, name: 1, mobile: 1 },
          lastMessage: 1,
          unreadCount: 1,
          hasMessages: true,
        },
      },
    ]);

    const userMap = new Map();
    bookingUsers.forEach(item => {
      if (item.user) {
        userMap.set(item.user._id.toString(), item);
      }
    });
    userMessages.forEach(item => {
      const userId = item.user?._id?.toString();
      if (userId) {
        if (userMap.has(userId)) {
          userMap.set(userId, {
            ...userMap.get(userId),
            lastMessage: item.lastMessage,
            unreadCount: item.unreadCount,
            hasMessages: true,
          });
        } else {
          userMap.set(userId, {
            ...item,
            hasBooking: false,
          });
        }
      }
    });

    const combinedUsers = Array.from(userMap.values());

    res.json({ ok: true, users: combinedUsers });
  } catch (err) {
    console.error('Error fetching practitioner users:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// For users: Get list of practitioners they've messaged or have approved bookings with
router.get('/user/practitioners', auth, async (req, res) => {
  try {
    if (req.user.isPractitioner) {
      return res.status(403).json({ ok: false, message: 'Access denied' });
    }

    const userId = req.user._id;
    console.log('Fetching practitioners for user:', userId); // Debug

    // Get practitioners from bookings
    let bookingPractitioners = [];
    try {
      const bookings = await Booking.find({ user: userId, status: 'approved' }).populate({
        path: 'therapy',
        populate: { path: 'practitioner', select: '_id name mobile' },
      });
      console.log('Bookings found:', bookings); // Debug
      bookingPractitioners = bookings
        .filter(b => b.therapy && b.therapy.practitioner)
        .map(booking => ({
          practitioner: {
            _id: booking.therapy.practitioner._id,
            name: booking.therapy.practitioner.name || 'Unknown',
            mobile: booking.therapy.practitioner.mobile || 'N/A',
          },
          lastMessage: null,
          unreadCount: 0,
          hasBooking: true,
        }));
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }

    // Get practitioners from messages
    let practitionerMessages = [];
    try {
      practitionerMessages = await Message.aggregate([
        {
          $match: {
            $or: [
              { sender: userId, senderRole: 'user', receiverRole: 'practitioner' },
              { receiver: userId, receiverRole: 'user', senderRole: 'practitioner' },
            ],
          },
        },
        {
          $group: {
            _id: {
              $cond: {
                if: { $eq: ['$senderRole', 'practitioner'] },
                then: '$sender',
                else: '$receiver',
              },
            },
            lastMessage: { $last: '$$ROOT' },
            unreadCount: {
              $sum: {
                $cond: {
                  if: {
                    $and: [
                      { $eq: ['$receiver', userId] },
                      { $eq: ['$receiverRole', 'user'] },
                      { $eq: ['$read', false] },
                    ],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'practitioners',
            localField: '_id',
            foreignField: '_id',
            as: 'practitioner',
          },
        },
        {
          $unwind: {
            path: '$practitioner',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            practitioner: {
              $cond: {
                if: { $ne: ['$practitioner', null] },
                then: { _id: '$practitioner._id', name: '$practitioner.name', mobile: '$practitioner.mobile' },
                else: { _id: '$_id', name: 'Unknown', mobile: 'N/A' },
              },
            },
            lastMessage: 1,
            unreadCount: 1,
            hasMessages: true,
          },
        },
      ]);
      console.log('Practitioner messages:', practitionerMessages); // Debug
    } catch (err) {
      console.error('Error fetching messages:', err);
    }

    // Combine and deduplicate
    const practitionerMap = new Map();
    bookingPractitioners.forEach(item => {
      practitionerMap.set(item.practitioner._id.toString(), item);
    });
    practitionerMessages.forEach(item => {
      const practitionerId = item.practitioner._id.toString();
      if (practitionerMap.has(practitionerId)) {
        practitionerMap.set(practitionerId, {
          ...practitionerMap.get(practitionerId),
          lastMessage: item.lastMessage,
          unreadCount: item.unreadCount,
          hasMessages: true,
        });
      } else {
        practitionerMap.set(practitionerId, {
          ...item,
          hasBooking: false,
        });
      }
    });

    const combinedPractitioners = Array.from(practitionerMap.values());
    console.log('Combined practitioners:', combinedPractitioners); // Debug

    res.json({ ok: true, practitioners: combinedPractitioners });
  } catch (err) {
    console.error('Error fetching user practitioners:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;