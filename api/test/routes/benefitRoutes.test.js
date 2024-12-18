import request from 'supertest';
import { expect } from 'chai';
import app from '../../index.js'

describe('GET /benefits/:universityId/categories', async function() {
  this.timeout(5000); // Aumenta el timeout a 5 segundos

  const itba_id = "de61ec4a-dc96-46ec-a951-572332f10477";

  it('should return a list of categories', (done) => {
    request(app)
      .get(`/benefits/${itba_id}/categories`)
      .expect(200)
      .expect('Content-Type', /json/)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.be.an('array');
        done();
      });
  });
});

describe('GET /benefits/:universityId/benefit', async function() {
    this.timeout(5000); // Aumenta el timeout a 5 segundos
  
    const itba_id = "de61ec4a-dc96-46ec-a951-572332f10477";
  
    it('should return a list of benefits', (done) => {
      request(app)
        .get(`/benefits/${itba_id}/benefit`)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.be.an('array');
          done();
        });
    });
  });

  describe('GET /benefits/:universityId/featured_images', async function() {
    this.timeout(5000); // Aumenta el timeout a 5 segundos
  
    const itba_id = "de61ec4a-dc96-46ec-a951-572332f10477";
  
    it('should return a list of images and it\'s correspondant data', (done) => {
      request(app)
        .get(`/benefits/${itba_id}/featured_images`)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.be.an('array');
          done();
        });
    });
  });

  describe('GET /benefits/:universityId/:category', async function() {
    this.timeout(5000); // Aumenta el timeout a 5 segundos
  
    const itba_id = "de61ec4a-dc96-46ec-a951-572332f10477";
    const category = "Deportes"
  
    it('should return a list of benefits of a specified category', (done) => {
      request(app)
        .get(`/benefits/${itba_id}/${category}`)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.be.an('array');
          done();
        });
    });
  });