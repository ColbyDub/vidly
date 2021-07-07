const request = require('supertest');
const {User} = require('../../models/user');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
let server;

describe('/api/genres', () => {
    beforeEach(() => { server = require('../../index'); });
    afterEach(async () => { 
        await User.deleteMany({});
        await server.close();
    });

    describe('GET /me', () => {
        let token;
        let newUser;

        const exec = async () => {
            return await request(server)
                .get('/api/users/me')
                .set('x-auth-token',token)
                .send();
        }

        beforeEach(async () => {
            newUser = new User({ email: 'rando.email@gmail.com' , password: '12345', name: 'Colby' });
            token = newUser.generateAuthToken();
            await newUser.save();
        });

        it('should return 401 if client isnt authenticated', async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });
        it('should return user if input is valid', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('email',newUser.email);
            expect(res.body).toHaveProperty('name',newUser.name);
        });
    });

    describe('POST /', () => {
        let token;
        let newUser;

        const exec = async () => {
            return await request(server)
                .post('/api/users')
                .set('x-auth-token',token)
                .send({ email: newUser.email, name: newUser.name, password: newUser.password });
        }

        beforeEach(async () => {
            newUser = new User({ email: 'rando.email@gmail.com' , password: '12345', name: 'Jhonson' });
            token = newUser.generateAuthToken();
        });

        it('should should return 400 if input email is not valid', async () => {
            newUser = new User({ email: 'rando.email.gmail.com' , password: '12345', name: 'Jhonson' });
            token = newUser.generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should should return 400 if input name is less than 5 characters', async () => {
            newUser = new User({ email: 'rando.email@gmail.com' , password: '12345', name: 'John' });
            token = newUser.generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should should return 400 if input email is less than 5 characters', async () => {
            newUser = new User({ email: 'c@.c' , password: '12345', name: 'Jhonson' });
            token = newUser.generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should should return 400 if input password is less than 5 characters', async () => {
            newUser = new User({ email: 'rando.email@gmail.com' , password: '1234', name: 'Jhonson' });
            token = newUser.generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should should return 400 if input password is less than 5 characters', async () => {
            const name = new Array(52).join('a');
            newUser = new User({ email: 'rando.email@gmail.com' , password: '12345', name: name });
            token = newUser.generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should should return 400 if user is already registered', async () => {
            await newUser.save();
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should save the user in db if input is valid', async () => {
            const res = await exec();
            const userInDb = await User.findById(res.body._id);

            expect(userInDb).not.toBeNull();
        });
        it('should return the user and token in header', async () => {
            const res = await exec();
            const userInDb = await User.findById(res.body._id);
            
            expect(res.body).toHaveProperty('name', newUser.name);
            expect(res.body).toHaveProperty('email', newUser.email);
            expect(res.body).toHaveProperty('_id');
            expect(res.header).toHaveProperty('x-auth-token',userInDb.generateAuthToken());
        });
        it('should store correct salted password in user db', async () => {
            const res = await exec();
            const userInDb = await User.findById(res.body._id);

            const result = bcrypt.compare(newUser.password, userInDb.password);
            expect(result).toBeTruthy();
        });
    });
});