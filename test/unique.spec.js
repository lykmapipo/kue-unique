'use strict';

//dependencies
var expect = require('chai').expect;
var faker = require('faker');
var _ = require('lodash');
var async = require('async');
var path = require('path');
var kue = require(path.join(__dirname, '..', 'index'));
var Job = kue.Job;
var q;


describe('kue unique', function () {
  before(function (done) {
    q = kue.createQueue();
    done();
  });

  after(function (done) {
    q.shutdown(done);
  });

  it('should be able to compute unique jobs store key', function (done) {
    expect(Job.getUniqueJobsKey).to.exist;
    expect(Job.getUniqueJobsKey).to.be.a('function');
    expect(Job.getUniqueJobsKey()).to.be.equal(q.client.getKey(
      'unique:jobs'));
    done();
  });

  it('should be able to add unique method to job prototype', function (done) {
    expect(Job.prototype.unique).to.exist;
    expect(Job.prototype.unique).to.be.a('function');
    done();
  });

  it('should be able to extend job data with unique key', function (done) {
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

  it('should be able to save job unique data', function (done) {
    var uniqueJobData = {};
    uniqueJobData[faker.random.uuid()] = faker.name.firstName();

    Job.saveUniqueJobsData(uniqueJobData, function (error,
      uniqueJobsData) {
      expect(error).to.not.exist;
      expect(uniqueJobsData).to.exist;
      expect(uniqueJobsData).to.eql(uniqueJobData);
      done(error, uniqueJobsData);
    });
  });


  it('should be able to get job unique data using its `unique identifier`',
    function (done) {
      var uniqueJobData = {};
      uniqueJobData[faker.random.uuid()] = faker.name.firstName();

      async.waterfall([
        function save(next) {
          Job.saveUniqueJobsData(uniqueJobData, next);
        },
        function get(savedUniqueJobData, next) {
          Job
            .getUniqueJobData(_.keys(uniqueJobData)[0], function (
              error, foundUniqueJobData) {
              expect(error).to.not.exist;
              expect(foundUniqueJobData).to.exist;
              expect(foundUniqueJobData).to.eql(uniqueJobData);
              next(error, foundUniqueJobData);
            });
        }
      ], done);
    });


  it('should be able to remove job unique data from jobs unique data',
    function (done) {
      var uniqueJobData = {};
      uniqueJobData[faker.random.uuid()] = faker.name.firstName();

      async.waterfall([
        function save(next) {
          Job.saveUniqueJobsData(uniqueJobData, next);
        },
        function assertSaved(savedUniqueJobsData, next) {
          var id = _.values(uniqueJobData)[0];
          expect(_.values(savedUniqueJobsData)).to.contain(id);
          next(null, id);
        },

        function remove(id, next) {
          Job
            .removeUniqueJobData(id, function (error, uniqueJobsData) {
              expect(error).to.not.exist;
              expect(uniqueJobsData).to.exist;
              next(error, uniqueJobsData, id);
            });
        },
        function assertRemoved(uniqueJobsData, id, next) {
          expect(_.values(uniqueJobsData)).to.not.contain(id);
          next(null, id);
        }
      ], done);
    });


  it('should be able to save unique job', function (done) {
    var unique = faker.name.firstName();

    q
      .create('email', {
        title: faker.lorem.sentence(),
        to: faker.internet.email()
      })
      .unique(unique)
      .save(function (error, job) {
        expect(job).to.exist;
        expect(job.data).to.exist;

        done();
      });
  });


  it('should be able to return same unique job if saved multiple times',
    function (done) {
      var unique = faker.name.firstName();

      async.waterfall([
          //save first job
          function (next) {
            q.create('email', {
                title: faker.lorem.sentence(),
                to: faker.internet.email()
              })
              .unique(unique)
              .save(next);
          },

          //later try to save another
          //job with same unique value 
          function (job1, next) {
            q.create('email', {
                title: faker.lorem.sentence(),
                to: faker.internet.email()
              })
              .unique(unique)
              .save(function (error, job2) {
                next(error, job1, job2);
              });
          }
        ],
        function (error, job1, job2) {

          expect(job2.alreadyExist).to.be.true;
          expect(job1.id).to.be.equal(job2.id);
          expect(job1.data.title).to.be.equal(job2.data.title);
          expect(job1.data.to).to.be.equal(job2.data.to);
          expect(job1.data.unique).to.be.equal(job2.data.unique);

          done();

        });
    });


  it('should be able to save non-unique jobs as normal', function (done) {
    var job = q.create('email', {
        title: faker.lorem.sentence(),
        to: faker.internet.email()
      })
      .save();

    expect(job).to.exist;
    expect(job.data).to.exist;

    done();
  });


  it('should be able to remove saved unique job and its associated data',
    function (done) {
      var unique = faker.name.firstName();
      var _job;

      async.waterfall([
          function save(next) {
            q.create('email', {
                title: faker.lorem.sentence(),
                to: faker.internet.email()
              })
              .unique(unique)
              .save(next);
          },

          function remove(job, next) {
            job.remove(next);
          },

          function assertRemove(job, next) {
            expect(job).to.exist;
            _job = job;
            next(null, job);
          },

          function getRemoveJob(job, next) {
            async.parallel({
              job: function getJob(_next) {
                Job.get(job.id, function (error, job) {

                  expect(error).to.exist;
                  expect(error.message)
                    .to.be.equal('job "' + _job.id +
                      '" doesnt exist');

                  _next(null, job);
                });
              },
              data: function getUniqueJobsData(_next) {
                Job.getUniqueJobsData(_next);
              }
            }, next);
          }
        ],
        function (error, results) {

          expect(results.job).to.not.exist;
          expect(_.values(results.data)).to.not.contain(_job.id);

          done();

        });
    });

  it('should be able to remove non-unique jobs as normal', function (done) {
    var job = q.create('email', {
      title: faker.lorem.sentence(),
      to: faker.internet.email()
    });

    job = job.remove();

    expect(job).to.exist;
    expect(job.data).to.exist;

    done();
  });

});