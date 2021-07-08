const mongoose = require('mongoose');
const express = require('express');
const {Movie, validateMovie} = require('../models/movie');
const {Genre} = require('../models/genre');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');
const validateObjectId = require('../middleware/validateObjectid');
const router = express.Router();


router.get('/', async (req, res) => {
    const movies = await Movie.find().sort('name');
    res.send(movies);
});

router.get('/:id', validateObjectId, async (req, res) => {
    const movie = await Movie.findById(req.params.id);
    if(!movie) res.status(404).send("Movie with the given ID was not found");
    else res.send(movie);
});

router.post('/', [auth, validate(validateMovie)], async (req, res) => {
    const genre = await Genre.findById(req.body.genreID);
    if(!genre) return res.status(400).send('Invalid genre');

    const movie = new Movie({ 
        title: req.body.title,
        genre: {
            _id: genre._id,
            name: genre.name
        },
        numberInStock: req.body.numberInStock,
        dailyRentalRate: req.body.dailyRentalRate
    });

    await movie.save();
    res.send(movie);
});

router.put('/:id',[auth, validateObjectId, validate(validateMovie)], async (req, res) => {
    const genre = await Genre.findById(req.body.genreID);
    if(!genre) return res.status(400).send('Invalid genre');

    const movie = await Movie.findByIdAndUpdate(req.params.id, {
        title: req.body.title,
        genre: {
            _id: genre._id,
            name: genre.name
        },
        numberInStock: req.body.numberInStock,
        dailyRentalRate: req.body.dailyRentalRate
    },
    { new: true });

    if(!movie)res.status(404).send("Movie with the given ID was not found");
    else res.send(movie);
})

router.delete('/:id', [auth, admin, validateObjectId], async (req, res) => {
    const movie = await Movie.findByIdAndRemove(req.params.id);

    if(!movie)res.status(404).send("Movie with the given ID was not found");
    else res.send(movie);
});

module.exports = router;