const _ = require('lodash');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const express = require('express');
const validate = require('../middleware/validate');
const {User} = require('../models/user');
const router = express.Router();

router.get('/', async (req, res) => {
    const users = await User.find().sort('name');
    res.send(users);
});

router.get('/:id', async (req, res) => {
    const user = await User.findById(req.body.id);
    if(!user)res.status(404).send("User with the given ID was not found");
    else res.send(user);
});

router.post('/', validate(validateUser), async (req, res) => {
    let user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send('Invalid email or password.');

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if(!validPassword) return res.status(400).send('Invalid email or password.');

    const token = user.generateAuthToken();
    res.header('x-auth-token',token).send(_.pick(req.body, ['name', 'email']));
});

function validateUser(req){
    const schema = Joi.object({
        email: Joi.string().min(5).max(255).required().email(),
        password: Joi.string().min(5).max(255).required(),
    });
    return schema.validate(req);
}

module.exports = router;