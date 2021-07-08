const mongoose = require('mongoose');
const express = require('express');
const Fawn = require('fawn');
const { Rental, validateRental } = require('../models/rental');
const { Customer } = require('../models/customer');
const { Movie } = require('../models/movie');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const validateObjectid = require('../middleware/validateObjectid');
const router = express.Router();

Fawn.init(mongoose);

router.get('/', async (req, res) => {
    const rentals = await Rental.find().sort('-dateOut');
    res.send(rentals);
});

router.get('/:id', validateObjectid, async (req, res) => {
    const rental = await Rental.findById(req.params.id);
    if(!rental)res.status(404).send("Rental with the given ID was not found");
    else res.send(rental);
});

router.post('/', [auth, validate(validateRental)], async (req, res) => {
    const customer = await Customer.findById(req.body.customerId);
    if(!customer) return res.status(400).send('Invalid customer id');

    const movie = await Movie.findById(req.body.movieId);
    if(!movie) return res.status(400).send('Invalid movie id');

    if(movie.numberInStock == 0) return res.status(400).send('Movie out of stock');

    let rental = new Rental({ 
        customer: {
            _id: customer._id,
            name: customer.name,
            phone: customer.phone
        },
        movie: {
            _id: movie._id,
            title: movie.title,
            dailyRentalRate: movie.dailyRentalRate
        }
    });


    try{
        await new Fawn.Task()
            .save('rentals', rental)
            .update('movies', { _id: mongoose.Types.ObjectId(movie._id) },
            {
                $inc: { numberInStock: -1 }
            })
            .run({useMongoose: true});

        res.send(rental);
    }
    catch(ex){
        res.status(500).send('Something failed.');
    }
    
});

module.exports = router;