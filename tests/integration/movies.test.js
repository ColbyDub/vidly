const mongoose = require('mongoose');
const request = require('supertest');
const {Movie} = require('../../models/movie');
const {Genre} = require('../../models/genre');

describe('/api/genres', () => {
    beforeEach(() => { server = require('../../index'); });
    afterEach(async () => { 
        await Movie.deleteMany({});
        await server.close();
    });
    describe('GET /', () => {
        it('should return all movies', async () =>{
            await Movie.collection.insertMany([
                { title: 'movie1', genreID: mongoose.Types.ObjectId(), numberInStock: 5, dailyRentalRate: 3},
                { title: 'movie2', genreID: mongoose.Types.ObjectId(), numberInStock: 3, dailyRentalRate: 5}
            ]);
    
            const res = await request(server).get('/api/movies');
    
            expect(res.status).toBe(200);
            expect(res.body.some(g => g.title === 'movie1')).toBeTruthy();
            expect(res.body.some(g => g.title === 'movie2')).toBeTruthy();
            expect(res.body.some(g => g.numberInStock === 5)).toBeTruthy();
            expect(res.body.some(g => g.numberInStock === 3)).toBeTruthy();
        });
    });
    describe('GET /:id', () => {
        it('should return movie if valid id is passed', async () => {
            const movie = new Movie({ title: 'movie1' , genre: mongoose.Types.ObjectId() , numberInStock: 5, dailyRentalRate: 3});
            await movie.save();

            const res = await request(server).get('/api/movies/'+movie._id);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', movie.name);
        });
        it('should return 404 if invalid Id is passed', async () => {
            const res = await request(server).get('/api/movies/1');
            expect(res.status).toBe(404);
        });
        it('should return 404 if no genre with the given Id is passed', async () => {
            const id = mongoose.Types.ObjectId();
            const res = await request(server).get('/api/movies/'+id);
            expect(res.status).toBe(404);
        });
    });
});