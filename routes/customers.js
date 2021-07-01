const {Customer, validateCustomer} = require('../models/customer')
const mongoose = require('mongoose');
const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();
const validate = require('../middleware/validate');


router.get('/', async (req, res) => {
    const customers = await Customer.find().sort('name');
    res.send(customers);
});

router.get('/:id', async (req, res) => {
    const customer = await Customer.findById(req.params.id);
    if(!customer)res.status(404).send("Customer with the given ID was not found");
    else res.send(customer);
});

router.post('/', [auth, validate(validateCustomer)], async (req, res) => {
    const customer = new Customer({ 
        name: req.body.name,
        phone: req.body.phone,
        isGold: req.body.isGold
    });

    try{
        await customer.save();
        res.send(customer);
    }
    catch(ex){
        for(field in ex.errors)
            console.log(ex.errors[field].message);
    }
});

router.put('/:id', auth, async (req, res) => {

    const { error } = validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    const customer = await Customer.findByIdAndUpdate(req.params.id, {
        name: req.body.name,
        phone: req.body.phone,
        isGold: req.body.isGold,
        new: true
    });

    if(!customer)res.status(404).send("Customer with the given ID was not found");

    res.send(customer);
})

router.delete('/:id', auth, async (req, res) => {
    const customer = await Customer.findByIdAndRemove(req.params.id);

    if(!customer)res.status(404).send("Customer with the given ID was not found");

    res.send(customer);
});

module.exports = router;