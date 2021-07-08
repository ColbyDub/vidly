const mongoose = require('mongoose');
const request = require('supertest');
const {Customer} = require('../../models/customer');
const { User } = require('../../models/user');
let server;

describe('/api/cutomers', () => {

    beforeEach(() => { server = require('../../index'); });
    afterEach(async () => { 
        await Customer.deleteMany({});
        await server.close();
     });

    describe('GET /', () => {
        it('should return customers in db', async () => {
            await Customer.collection.insertMany([
                { name: 'Jake',
                  phone: '12345' },
                { name: 'Fin',
                  phone: '12987' }
            ]);

            const res = await request(server).get('/api/customers');

            expect(res.status).toBe(200);
            expect(res.body.some(g => g.name === 'Jake')).toBeTruthy();
            expect(res.body.some(g => g.name === 'Fin')).toBeTruthy();
        });
    });
    describe('GET /:id', () => {
        it('should return customeer if valid id is passed', async () => {
            const customer = new Customer({ name: 'cust1', phone: '12345' });
            await customer.save();

            const res = await request(server).get('/api/customers/' + customer._id);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', customer.name);
            expect(res.body).toHaveProperty('phone', customer.phone);
        });
        it('should return return 404 if invalid id is passed', async () => {
            const res = await request(server).get('/api/customers/12345');
            expect(res.status).toBe(404);
        });
        it('should return return 404 if no customer with id given was found', async () => {
            const id = mongoose.Types.ObjectId();
            const res = await request(server).get('/api/customers/'+id);
            expect(res.status).toBe(404);
        });
    });
    describe('POST /', () => {
        let token;
        let name;
        let phone;

        const exec = async () => {
            return await request(server)
                .post('/api/customers')
                .set('x-auth-token',token)
                .send({ name , phone });
        }

        beforeEach(() => {
            token = new User().generateAuthToken();
            name = 'customer';
            phone = '12345';
        });
        it('should return 401 if client is not logged in', async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });
        it('should return 400 if name is less than 3 characters', async () => {
            name = 'fe';
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 400 if name is more than 50 characters', async () => {
            name = new Array(52).join('a');
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 400 if phone is less than 5 characters', async () => {
            phone = '1234';
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 400 if phone is more than 50 characters', async () => {
            phone = new Array(52).join('1');
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should save the customer if valid', async () => {
            const res = await exec();

            const cust = await Customer.find({ name: 'customer'});
            expect(cust).not.toBeNull();
        });
        it('should return the customer if successful', async () => {
            const res = await exec();
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name','customer');
            expect(res.body).toHaveProperty('phone','12345');
        });
    });
    describe('PUT /:id', () => {
        let token;
        let name;
        let phone;
        let cust;
        let id;

        const exec = async () => {
            return await request(server)
                .put('/api/customers/'+id)
                .set('x-auth-token',token)
                .send({ name , phone });
        }

        beforeEach( async () => {
            cust = new Customer({ name: 'cust', phone: '12345' });
            await cust.save();

            token = new User().generateAuthToken();
            id = cust._id;
            name = 'custo';
            phone = '123456';
        });

        it('should return 401 if client is not logged in', async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });
        it('should return 400 if name is less than 3 characters', async () => {
            name = 'cu';
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 400 if name is more than 50 characters', async () => {
            name = new Array(52).join('a');
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 400 if phone is less than 5 characters', async () => {
            phone = '1234';
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 400 if phone is more than 50 characters', async () => {
            phone = new Array(52).join('1');
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 404 if id is invalid', async () => {
            id = 1;
            const res = await exec();
            expect(res.status).toBe(404);
        });
        it('should return 404 if customer with the given id is not found', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });
        it('should update the customer if input is valid', async () => {
            await exec();

            const customer = await Customer.findById(id);

            expect(customer.name).toBe(name);
            expect(customer.phone).toBe(phone);
        });
        it('should return customer if valid', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', name);
            expect(res.body).toHaveProperty('phone', phone);
        });
    });
    describe('DELETE /:id', () => {
        let token;
        let id;
        let cust;

        const exec = async () => {
            return await request(server)
                .delete('/api/customers/' + id)
                .set('x-auth-token', token)
                .send()
        }

        beforeEach(async () => {     
            cust = new Customer({ name: 'cust', phone: '12345' });
            await cust.save();
            
            token = new User({ isAdmin: true }).generateAuthToken();     
            id = cust._id; 
        });

        it('should return 401 if client is not logged in', async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });
        it('should return 403 if user is not admin', async () => {
            token = new User().generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });
        it('should return 404 if id is invalid', async () => {
            id = 1;
            const res = await exec();
            expect(res.status).toBe(404);
        });
        it('should return 404 if customer with given id was not found', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });
        it('should delete the customer from the db if successful', async () => {
            await exec();
            const custInDb = await Customer.findById(id);
            expect(custInDb).toBeNull();
        });
        it('should return the deleted customer if successful', async () => {
            const res = await exec();
            expect(res.body).toHaveProperty('_id',cust._id.toHexString())
            expect(res.body).toHaveProperty('name',cust.name);
            expect(res.body).toHaveProperty('phone',cust.phone);
        });
    });
});