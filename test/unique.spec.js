// dependencies
const { expect } = require('chai');
const faker = require('@lykmapipo/test-helpers');
const _ = require('lodash');
const async = require('async');
const kue = require('../src/index');

const { Job } = kue;
let q;

describe('kue unique', () => {
  before((done) => {
    q = kue.createQueue();
    done();
  });

  after((done) => {
    q.shutdown(done);
  });

  it('should be able to compute unique jobs store key', (done) => {
    expect(Job.getUniqueJobsKey).to.exist;
    expect(Job.getUniqueJobsKey).to.be.a('function');
    expect(Job.getUniqueJobsKey()).to.be.equal(q.client.getKey('unique:jobs'));
    done();
  });

  it('should be able to add unique method to job prototype', (done) => {
    expect(Job.prototype.unique).to.exist;
    expect(Job.prototype.unique).to.be.a('function');
    done();
  });

  it('should be able to extend job data with unique key', (done) => {
    const unique = faker.name.firstName();

    const job = q
      .create('email', {
        title: faker.lorem.sentence(),
        to: faker.internet.email(),
      })
      .unique(unique);

    expect(job.data.unique).to.exist;
    expect(job.data.unique).to.be.equal(unique);

    done();
  });

  it('should be able to save job unique data', (done) => {
    const uniqueJobData = {};
    uniqueJobData[faker.random.uuid()] = faker.name.firstName();

    Job.saveUniqueJobsData(uniqueJobData, (error, uniqueJobsData) => {
      expect(error).to.not.exist;
      expect(uniqueJobsData).to.exist;
      expect(uniqueJobsData).to.eql(uniqueJobData);
      done(error, uniqueJobsData);
    });
  });

  it('should be able to get job unique data using its `unique identifier`', (done) => {
    const uniqueJobData = {};
    uniqueJobData[faker.random.uuid()] = faker.name.firstName();

    async.waterfall(
      [
        function save(next) {
          Job.saveUniqueJobsData(uniqueJobData, next);
        },
        function get(savedUniqueJobData, next) {
          Job.getUniqueJobData(
            _.keys(uniqueJobData)[0],
            (error, foundUniqueJobData) => {
              expect(error).to.not.exist;
              expect(foundUniqueJobData).to.exist;
              expect(foundUniqueJobData).to.eql(uniqueJobData);
              next(error, foundUniqueJobData);
            }
          );
        },
      ],
      done
    );
  });

  it('should be able to remove job unique data from jobs unique data', (done) => {
    const uniqueJobData = {};
    uniqueJobData[faker.random.uuid()] = faker.name.firstName();

    async.waterfall(
      [
        function save(next) {
          Job.saveUniqueJobsData(uniqueJobData, next);
        },
        function assertSaved(savedUniqueJobsData, next) {
          const id = _.values(uniqueJobData)[0];
          expect(_.values(savedUniqueJobsData)).to.contain(id);
          next(null, id);
        },

        function remove(id, next) {
          Job.removeUniqueJobData(id, (error, uniqueJobsData) => {
            expect(error).to.not.exist;
            expect(uniqueJobsData).to.exist;
            next(error, uniqueJobsData, id);
          });
        },
        function assertRemoved(uniqueJobsData, id, next) {
          expect(_.values(uniqueJobsData)).to.not.contain(id);
          next(null, id);
        },
      ],
      done
    );
  });

  it('should be able to save unique job', (done) => {
    const unique = faker.name.firstName();

    q.create('email', {
      title: faker.lorem.sentence(),
      to: faker.internet.email(),
    })
      .unique(unique)
      .save((error, job) => {
        expect(job).to.exist;
        expect(job.data).to.exist;

        done();
      });
  });

  it('should be able to return same unique job if saved multiple times', (done) => {
    const unique = faker.name.firstName();

    async.waterfall(
      [
        // save first job
        (next) => {
          q.create('email', {
            title: faker.lorem.sentence(),
            to: faker.internet.email(),
          })
            .unique(unique)
            .save(next);
        },

        // later try to save another
        // job with same unique value
        (job1, next) => {
          q.create('email', {
            title: faker.lorem.sentence(),
            to: faker.internet.email(),
          })
            .unique(unique)
            .save((error, job2) => {
              next(error, job1, job2);
            });
        },
      ],
      (error, job1, job2) => {
        expect(job2.alreadyExist).to.be.true;
        expect(job1.id).to.be.equal(job2.id);
        expect(job1.data.title).to.be.equal(job2.data.title);
        expect(job1.data.to).to.be.equal(job2.data.to);
        expect(job1.data.unique).to.be.equal(job2.data.unique);

        done();
      }
    );
  });

  it('should be able to save non-unique jobs as normal', (done) => {
    const job = q
      .create('email', {
        title: faker.lorem.sentence(),
        to: faker.internet.email(),
      })
      .save();

    expect(job).to.exist;
    expect(job.data).to.exist;

    done();
  });

  it('should be able to remove saved unique job and its associated data', (done) => {
    const unique = faker.name.firstName();
    let _job;

    async.waterfall(
      [
        function save(next) {
          q.create('email', {
            title: faker.lorem.sentence(),
            to: faker.internet.email(),
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
          async.parallel(
            {
              job: function getJob(_next) {
                Job.get(job.id, (error /* , job */) => {
                  expect(error).to.exist;
                  expect(error.message).to.be.equal(
                    `job "${_job.id}" doesnt exist`
                  );

                  _next(null, job);
                });
              },
              data: function getUniqueJobsData(_next) {
                Job.getUniqueJobsData(_next);
              },
            },
            next
          );
        },
      ],
      (error, results) => {
        expect(results.job).to.not.exist;
        expect(_.values(results.data)).to.not.contain(_job.id);

        done();
      }
    );
  });

  it('should be able to remove non-unique jobs as normal', (done) => {
    let job = q.create('email', {
      title: faker.lorem.sentence(),
      to: faker.internet.email(),
    });

    job = job.remove();

    expect(job).to.exist;
    expect(job.data).to.exist;

    done();
  });
});
