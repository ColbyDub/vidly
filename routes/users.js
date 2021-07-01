const _ = require('lodash');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const {User, validateUser} = require('../models/user');
const router = express.Router();


router.get('/me', auth, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    res.send(user);
});

router.post('/', validate(validateUser), async (req, res) => {
    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).send('User already registered.');

    user = new User(_.pick(req.body, ['name', 'email', 'password']));

    //password salt
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    await user.save();
    const token = user.generateAuthToken();
    res.header('x-auth-token',token).send(_.pick(user, ['name', 'email']));

});

module.exports = router;