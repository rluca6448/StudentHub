import { expect } from 'chai';
import request from 'supertest';
import app from '../../index.js'


//Test algo más funcional, chequea token jwt
describe('POST /users/validate_login', function()  {
    this.timeout(5000);
    
    it('should return a JWT token for valid credentials', (done) => {
      request(app)
        .post('/users/validate_login')
        .send({ username: 'Uprueba', password: '12345678' })
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('token');
          done();
        });
    });
  });
  