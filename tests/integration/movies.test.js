const mongoose = require('mongoose');
const request = require('supertest');
const {Movie} = require('../../models/movie');
const {Genre} = require('../../models/genre');
const { User } = require('../../models/user');

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
        it('should return 404 if invalid Id is passed', async () => {
            const res = await request(server).get('/api/movies/1');
            expect(res.status).toBe(404);
        });
        it('should return 404 if no movie with the given Id is passed', async () => {
            const id = mongoose.Types.ObjectId();
            const res = await request(server).get('/api/movies/'+id);
            expect(res.status).toBe(404);
        });
        it('should return movie if valid id is passed', async () => {
            const movie = new Movie({ title: 'movie1' , genre: mongoose.Types.ObjectId() , numberInStock: 5, dailyRentalRate: 3});
            await movie.save();

            const res = await request(server).get('/api/movies/'+movie._id);
            expect(res.body).toHaveProperty('name', movie.name);
        });
    });
    describe('POST /', () => {
        let token;
        let title;
        let numberInStock;
        let dailyRentalRate;
        let genreID;
        let genre;

        const exec = function(){
            return request(server)
                .post('/api/movies')
                .set('x-auth-token',token)
                .send({ title, numberInStock, dailyRentalRate, genreID });
        }

        beforeEach( async() => {
            token = new User().generateAuthToken();
            title = 'Title';
            numberInStock = 5;
            dailyRentalRate = 2;

            genre = new Genre({ name: 'genre'});
            await genre.save();

            genreID = genre._id;
        });

        afterEach(() => {
            Genre.deleteMany({});
        })

        it('should return 401 if no token is provided', async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });
        it('should return 400 if title is not provided', async () => {
            title = '';
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 400 if dailyRentalRate is not valid', async () => {
            dailyRentalRate = -1;
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 400 if numberInStock is not valid', async () => {
            numberInStock = -1;
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 400 if genre with given id is not found', async () => {
            genreID = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should save the movie if input is valid', async () => {
            const res = await exec();
            const movieInDb = Movie.findById(res.body._id);
            expect(movieInDb).not.toBeNull();
        });
        it('should return the movie', async() => {
            const res = await exec();

            expect(res.body).toHaveProperty('title', title);
            expect(res.body.genre._id).toEqual(genre._id.toHexString());
            expect(res.body.genre.name).toEqual(genre.name);
            expect(res.body).toHaveProperty('numberInStock', numberInStock);
            expect(res.body).toHaveProperty('dailyRentalRate', dailyRentalRate);
        });
    });
    describe('PUT /id', () => {
        let token;
        let title;
        let numberInStock;
        let dailyRentalRate;
        let genreID;
        let genre;
        let id;

        const exec = function(){
            return request(server)
                .put('/api/movies/' + id)
                .set('x-auth-token',token)
                .send({ title, numberInStock, dailyRentalRate, genreID });
        }

        beforeEach( async() => {
            genre = new Genre({ name: 'genre' });
            await genre.save();

            movie = new Movie({ 
                title: 'Title',
                genre: genre,
                numberInStock: 5,
                dailyRentalRate: 2
            });
            await movie.save();

            id = movie._id;
            genreID = genre._id;
            token = new User().generateAuthToken();
            title = 'newTitle';
            numberInStock = 6;
            dailyRentalRate = 3;

        });

        it('should return 401 if no token is provided', async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });
        it('should return 400 if invalid title is provided', async () => {
            title = '';
            let res = await exec();
            expect(res.status).toBe(400);

            title = new Array(257).join('a');
            res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 400 if dailyRentalRate is not valid', async () => {
            dailyRentalRate = -1;
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 400 if numberInStock is not valid', async () => {
            numberInStock = -1;
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 400 if no genre with given id is found', async () => {
            genreID = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 404 if invalid movie id is passed', async () => {
            id = 1;
            const res = await exec();
            expect(res.status).toBe(404);
        });
        it('should return 404 if movie with given id is not found', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });
        it('should update the movie in db if successful', async () => {
            await exec();
            const movieInDb = await Movie.findById(id);
            expect(movieInDb.title).toBe(title);
            expect(movieInDb.dailyRentalRate).toBe(dailyRentalRate);
            expect(movieInDb.numberInStock).toBe(numberInStock);
        });
        it('should return the movie if successful', async () => {
            const res = await exec();
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('title',title);
            expect(res.body).toHaveProperty('dailyRentalRate', dailyRentalRate);
            expect(res.body).toHaveProperty('numberInStock', numberInStock);
            expect(res.body.genre).toHaveProperty('_id',genreID.toHexString());
            expect(res.body.genre).toHaveProperty('name',genre.name);
        });
    });
    describe('DELETE /:id', () => {
        let id;
        let token;
        let movie;

        const exec = function() {
            return request(server)
                .delete('/api/movies/' + id)
                .set('x-auth-token', token)
                .send()
        }
        beforeEach(async() => {
            genre = new Genre({ name: 'genre' });
            await genre.save();

            movie = new Movie({ 
                title: 'Title',
                genre: genre,
                numberInStock: 5,
                dailyRentalRate: 2
            });
            await movie.save();

            id = movie._id;
            token = new User({ isAdmin: true }).generateAuthToken();
        });

        it('should return 401 if no token provided', async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });
        it('should return 403 if user is not admin', async () => {
            token = new User({ isAdmin: false }).generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });
        it('should return 404 if invalid id is passed', async () => {
            id = 1;
            const res = await exec();
            expect(res.status).toBe(404);
        });
        it('should return 404 if invalid id is passed', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });
        it('should delete the movie if successful', async () => {
            await exec();
            const movieInDb = await Movie.findById(id);
            expect(movieInDb).toBeNull();
        });
        it('should return the removed movie', async () => {
            const res = await exec();
            expect(res.body).toHaveProperty('title',movie.title);
            expect(res.body.genre).toHaveProperty('_id',movie.genre._id.toHexString());
            expect(res.body.genre).toHaveProperty('name',movie.genre.name);
            expect(res.body).toHaveProperty('numberInStock',movie.numberInStock);
            expect(res.body).toHaveProperty('dailyRentalRate',movie.dailyRentalRate);

        });
    });
});