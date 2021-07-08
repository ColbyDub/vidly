const { Rental } = require('../../models/rental');
const { Movie } = require('../../models/movie');
const { User } = require('../../models/user');
const mongoose = require('mongoose');
const request = require('supertest');
const { Customer } = require('../../models/customer');

describe('/api/rentals', () => {
    let server;

    beforeEach(() => {server = require('../../index');});
    afterEach(async () => { 
        await server.close();
    });

    describe('GET /', () => {
        let customerId;
        let movieId;
    
        beforeEach( async () => {
            customerId = mongoose.Types.ObjectId();
            movieId = mongoose.Types.ObjectId();
    
        });
        afterEach(async () => { 
            await Rental.deleteMany({});
        });

        it('should return all movies', async () =>{
            await Rental.collection.insertMany([
                { customer: {
                    _id: customerId,
                    name: '12345',
                    phone: '12345'
                },
                movie: {
                    _id: movieId,
                    title: '12345',
                    dailyRentalRate: 2,
                    genre: { name: '12345' },
                    numberInStock: 10
                }},
                { customer: {
                    _id: customerId,
                    name: 'Johnny',
                    phone: '12345'
                },
                movie: {
                    _id: movieId,
                    title: '12345',
                    dailyRentalRate: 2,
                    genre: { name: '12345' },
                    numberInStock: 10
                }}
            ]);

            const res = await request(server).get('/api/rentals').send();

            expect(res.body.some(g => g.customer.name === '12345')).toBeTruthy();
            expect(res.body.some(g => g.customer.name === 'Johnny')).toBeTruthy();
            expect(res.body.some(g => g.movie.title === '12345')).toBeTruthy();
            expect(res.body.some(g => g.movie.title === '12345')).toBeTruthy();
        });
    });
    describe('GET /:id', () => {
        let rental;
        let token;
        let id;

        beforeEach(async () => {
            customerId = mongoose.Types.ObjectId();
            movieId = mongoose.Types.ObjectId();

            rental = new Rental({
                customer: {
                    _id: customerId,
                    name: 'Johnny',
                    phone: '12345'
                },
                movie: {
                    _id: movieId,
                    title: '12345',
                    dailyRentalRate: 2,
                    genre: { name: '12345' },
                    numberInStock: 10
                }
            });

            await rental.save();

            id = rental._id;
            token = new User().generateAuthToken();
        });
        afterEach(async() => {
            await Rental.deleteMany({});
        });

        const exec = function() {
            return request(server)
                .get('/api/rentals/' + id)
                .set('x-auth-token',token)
                .send()
        }

        it('should return 404 if rental id is invalid', async () => {
            id = 1;
            const res = await exec();
            expect(res.status).toBe(404);
        });
        it('should return 404 if rental with given id is not found', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });
        it('should return rental with the given id', async () =>{
            const res = await exec();
            expect(res.body.movie).toHaveProperty('title','12345');
            expect(res.body.movie).toHaveProperty('dailyRentalRate', 2);
            expect(res.body.customer).toHaveProperty('name','Johnny');
            expect(res.body.customer).toHaveProperty('phone','12345');
        });
    });
    describe('POST /', () => {
        let token;
        let customerId;
        let movieId;
        let movie;
        let customer;

        beforeEach(async () => {
            customerId = mongoose.Types.ObjectId();
            movieId = mongoose.Types.ObjectId();
    
            movie = new Movie({
                _id: movieId,
                title: '12345',
                dailyRentalRate: 2,
                genre: { name: '12345' },
                numberInStock: 10
            });

            await movie.save();

            customer = new Customer({
                _id: customerId,
                name: 'Johnny',
                phone: '12345'
            })

            await customer.save();
            rental = new Rental({
                customer: customer,
                movie: movie
            });

            token = new User().generateAuthToken();
        });

        afterEach(async() => {
            await Customer.deleteMany({});
            await Movie.deleteMany({});
            await Rental.deleteMany({});
        });

        const exec = function() {
            return request(server)
                .post('/api/rentals')
                .set('x-auth-token',token)
                .send({customerId, movieId})
        }
        it('should return 401 if no token provided', async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });
        it('should return 400 if invalid movieId is passed', async () =>{
            //movieId is passed in req.body so it is validated with Joi -> 400
            movieId = 1;
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 400 if invalid customerId is passed', async () =>{
            //customerId is passed in req.body so it is validated with Joi -> 400
            customerId = 1;
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 400 if movie with given id was not found', async () =>{
            movieId = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 400 if customer with given id was not found', async () =>{
            customerId = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 400 if numberInStock is 0', async () =>{
            movieId = mongoose.Types.ObjectId();
            movie = new Movie({
                _id: movieId,
                title: '12345',
                dailyRentalRate: 2,
                genre: { name: '12345' },
                numberInStock: 0
            });
            movie.save();
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return the rental if successful', async() => {
            const res = await exec();
            expect(res.body.movie).toHaveProperty('title','12345');
            expect(res.body.movie).toHaveProperty('dailyRentalRate', 2);
            expect(res.body.customer).toHaveProperty('_id', customerId.toHexString());
            expect(res.body.customer).toHaveProperty('name','Johnny');
            expect(res.body.customer).toHaveProperty('phone', '12345');
        });
        it('should put rental in the db', async () => {
            const res = await exec();
            const rental = Rental.findById(res.body._id);
            expect(rental).not.toBeNull();
        });
        it('should update the numberInStock of the movie', async () => {
            const res = await exec();
            const movie = await Movie.findById(res.body.movie._id);
            expect(movie.numberInStock).toBe(9);
        });
    });
});