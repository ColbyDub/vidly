const request = require('supertest');
const {Genre} = require('../../models/genre');
const {User} = require('../../models/user');
const mongoose = require('mongoose');
let server;

describe('/api/genres', () => {
    beforeEach(() => { server = require('../../index'); });
    afterEach(async () => { 
        await Genre.deleteMany({});
        await server.close();
     });

    describe('GET /', () => {
        it('should return all genres', async () => {
            await Genre.collection.insertMany([
                { name: 'genre1' },
                { name: 'genre2' },
            ]);

            const res = await request(server).get('/api/genres');

            expect(res.body.some(g => g.name === 'genre1')).toBeTruthy();
            expect(res.body.some(g => g.name === 'genre2')).toBeTruthy();
        });
    });
    describe('Get /:id', () => {

        it('should return 404 if invalid Id is passed', async () => {
            const res = await request(server).get('/api/genres/1');
            expect(res.status).toBe(404);
        });
        it('should return 404 if no genre with the given Id is passed', async () => {
            const id = mongoose.Types.ObjectId();
            const res = await request(server).get('/api/genres/'+id);
            expect(res.status).toBe(404);
        });
        it('should return genre if valid id is passed', async () => {
            const genre = new Genre({ name: 'genre1' });
            await genre.save();

            const res = await request(server).get('/api/genres/'+genre._id);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', genre.name);
        });
    });

    describe('POST /', () => {
        let token;
        let name;

        const exec = async () => {
            return request(server)
                .post('/api/genres')
                .set('x-auth-token',token)
                .send({ name });
        }

        beforeEach(() => {
            token = new User().generateAuthToken();
            name = 'genre1';
        })
            

        it('should return 401 if client is not logged in', async () => {
            token = "";
            const res = await exec();

            expect(res.status).toBe(401);
        });
        it('should return 400 if genre is less than 5 characters', async () => {
            name = '1234';
            const res = await exec();

            expect(res.status).toBe(400);
        });
        it('should return 400 if genre is more than 50 characters', async () => {
            
            name = new Array(52).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        })
        it('should save the genre if it is valid', async () => {
            const res = await exec();

            const genre = await Genre.find({ name: 'genre1' });

            expect(genre).not.toBeNull();
        });
        it('should return the genre if valid', async () => {
            
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', 'genre1');

        });
    });

    describe('PUT /:id', () => {
        let token;
        let newName;
        let id;
        let genre;

        const exec = async () => {
            return request(server)
                .put('/api/genres/' + id)
                .set('x-auth-token',token)
                .send({ name: newName });
        };

        beforeEach(async () => {
            // Before each test we need to create a genre and 
            // put it in the database.      
            genre = new Genre({ name: 'genre1' });
            await genre.save();
            
            token = new User().generateAuthToken();     
            id = genre._id; 
            newName = 'updatedName'; 
        });

        it('should return 401 if client is not logged in', async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });
        it('should return 400 if genre is less than 5 characters', async () => {
            newName = '1234';
            const res = await exec();

            expect(res.status).toBe(400);
        });
        it('should return 400 if genre is more than 50 characters', async () => {
            newName = new Array(52).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });
        it('should return 404 if id is invalid', async () => {
            id = 1;
            const res = await exec();
            expect(res.status).toBe(404);
        });
        it('should return 404 if genre with the given id is not found', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });
        it('should update the genre if input is valid', async () => {
            await exec();

            const genre = await Genre.findById(id);

            expect(genre.name).toBe(newName);
        });
        it('should return genre if valid', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', newName);
        });
    });

    describe('DELETE /:id', () => {
        let token;
        let id;
        let genre;

        const exec = async () => {
            return request(server)
                .delete('/api/genres/' + id)
                .set('x-auth-token', token)
                .send()
        }

        beforeEach(async () => {     
            genre = new Genre({ name: 'genre1' });
            await genre.save();
            
            token = new User({ isAdmin: true }).generateAuthToken();     
            id = genre._id; 
        });

        it('should return 401 if client is not logged in', async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 403 if client is not admin', async () => {
            token = new User({ isAdmin: false }).generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });
        it('should return 404 if id is invalid', async () => {
            id = 1;
            const res = await exec();
            expect(res.status).toBe(404);
        });
        it('should return 404 if genre with the given id is not found', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });
        it('should remove the genre from the db if valid input', async () => {
            await exec();
            const genreInDb = await Genre.findById(id);
            expect(genreInDb).toBeNull();
        });
        it('should return the removed genre', async () => {
            const res = await exec();
            expect(res.body).toHaveProperty('_id', genre._id.toHexString());
            expect(res.body).toHaveProperty('name', genre.name);
        });
    });


});