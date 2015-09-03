'use strict';

//dependencies
var expect = require('chai').expect;
var faker = require('faker');
var path = require('path');
var kue = require(path.join(__dirname, '..', 'index'));
var Job = kue.Job;
var q;


describe('kue#unique', function() {
    before(function(done) {
        q = kue.createQueue();
        done();
    });

    after(function(done) {
        q.shutdown(done);
    });

    it('should be able to compute unique jobs store key', function(done) {
        expect(Job.getUniqueJobsKey).to.exist;
        expect(Job.getUniqueJobsKey).to.be.a.function;
        expect(Job.getUniqueJobsKey()).to.be.equal(q.client.getKey('unique:jobs'));
        done();
    });

    it('should be able to add unique method to job prototype', function(done) {
        expect(Job.prototype.unique).to.exist;
        expect(Job.prototype.unique).to.be.a.function;
        done();
    });

    it('should be able to extend job data with unique key', function(done) {
        var unique = faker.name.firstName();

        var job = q
            .create('email', {
                title: faker.lorem.sentence(),
                to: faker.internet.email()
            })
            .unique(unique);

        expect(job.data.unique).to.exist;
        expect(job.data.unique).to.be.equal(unique);

        done();
    });

});