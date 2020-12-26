import { values } from 'lodash';
import { parallel, waterfall } from 'async';
import { expect, faker } from '@lykmapipo/test-helpers';
import { createJob } from '@lykmapipo/kue-common';

import { Job } from 'kue';
import '../src/index';

describe('kue unique', () => {
  it('should compute unique jobs store key', (done) => {
    expect(Job.getUniqueJobsKey).to.exist;
    expect(Job.getUniqueJobsKey).to.be.a('function');
    expect(Job.getUniqueJobsKey()).to.be.equal(
      Job.client.getKey('unique:jobs')
    );
    done();
  });

  it('should add unique method to job prototype', (done) => {
    expect(Job.prototype.unique).to.exist;
    expect(Job.prototype.unique).to.be.a('function');
    done();
  });

  it('should extend job data with unique key', (done) => {
    const uniqueKey = faker.random.uuid();

    const job = createJob({
      type: 'email',
      title: faker.lorem.sentence(),
      to: faker.internet.email(),
    }).unique(uniqueKey);

    expect(job.data.unique).to.exist;
    expect(job.data.unique).to.be.equal(uniqueKey);

    done();
  });

  it('should save job unique data with number ids type', (done) => {
    const uniqueJobData = {};
    const uniqueKey = faker.random.uuid();
    const jobId = faker.random.number();
    uniqueJobData[uniqueKey] = jobId;

    Job.saveUniqueJobsData(uniqueJobData, (error, uniqueJobsData) => {
      expect(error).to.not.exist;
      expect(uniqueJobsData).to.exist;
      expect(uniqueJobsData[uniqueKey]).to.eql(jobId);
      done(error, uniqueJobsData);
    });
  });

  it('should save job unique data with other ids type', (done) => {
    const uniqueJobData = {};
    const uniqueKey = faker.random.uuid();
    const jobId = faker.random.uuid();
    uniqueJobData[uniqueKey] = jobId;

    Job.saveUniqueJobsData(uniqueJobData, (error, uniqueJobsData) => {
      expect(error).to.not.exist;
      expect(uniqueJobsData).to.exist;
      expect(uniqueJobsData[uniqueKey]).to.eql(jobId);
      done(error, uniqueJobsData);
    });
  });

  it('should get job unique data using its unique key', (done) => {
    const uniqueJobData = {};
    const uniqueKey = faker.random.uuid();
    const jobId = faker.random.uuid();
    uniqueJobData[uniqueKey] = jobId;

    waterfall(
      [
        (next) => {
          Job.saveUniqueJobsData(uniqueJobData, next);
        },
        (savedUniqueJobData, next) => {
          Job.getUniqueJobData(uniqueKey, (error, foundUniqueJobData) => {
            expect(error).to.not.exist;
            expect(foundUniqueJobData).to.exist;
            expect(foundUniqueJobData[uniqueKey]).to.eql(jobId);
            next(error, foundUniqueJobData);
          });
        },
      ],
      done
    );
  });

  it('should get job unique data using its unique key', (done) => {
    const uniqueJobData = {};
    const uniqueKey = faker.random.uuid();
    const jobId = faker.random.number();
    uniqueJobData[uniqueKey] = jobId;

    waterfall(
      [
        (next) => {
          Job.saveUniqueJobsData(uniqueJobData, next);
        },
        (savedUniqueJobData, next) => {
          Job.getUniqueJobData(uniqueKey, (error, foundUniqueJobData) => {
            expect(error).to.not.exist;
            expect(foundUniqueJobData).to.exist;
            expect(foundUniqueJobData[uniqueKey]).to.eql(jobId);
            next(error, foundUniqueJobData);
          });
        },
      ],
      done
    );
  });

  it('should remove job unique data from jobs unique data', (done) => {
    const uniqueJobData = {};
    const uniqueKey = faker.random.uuid();
    const jobId = faker.random.uuid();
    uniqueJobData[uniqueKey] = jobId;

    waterfall(
      [
        (next) => {
          Job.saveUniqueJobsData(uniqueJobData, next);
        },
        (savedUniqueJobsData, next) => {
          expect(values(savedUniqueJobsData)).to.contain(jobId);
          next(null, jobId);
        },

        (id, next) => {
          Job.removeUniqueJobData(id, (error, uniqueJobsData) => {
            expect(error).to.not.exist;
            expect(uniqueJobsData).to.exist;
            next(error, uniqueJobsData, id);
          });
        },
        (uniqueJobsData, id, next) => {
          expect(values(uniqueJobsData)).to.not.contain(id);
          next(null, id);
        },
      ],
      done
    );
  });

  it('should save unique job', (done) => {
    const uniqueKey = faker.name.firstName();

    createJob({
      type: 'email',
      title: faker.lorem.sentence(),
      to: faker.internet.email(),
    })
      .unique(uniqueKey)
      .save((error, job) => {
        expect(job).to.exist;
        expect(job.data).to.exist;
        done();
      });
  });

  it('should return same unique job if saved multiple times', (done) => {
    const uniqueKey = faker.random.uuid();

    waterfall(
      [
        // save first job
        (next) => {
          createJob({
            type: 'email',
            title: faker.lorem.sentence(),
            to: faker.internet.email(),
          })
            .unique(uniqueKey)
            .save(next);
        },

        // later try to save another
        // job with same unique value
        (job1, next) => {
          createJob({
            type: 'email',
            title: faker.lorem.sentence(),
            to: faker.internet.email(),
          })
            .unique(uniqueKey)
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

  it('should save non-unique jobs as normal', (done) => {
    const job = createJob({
      type: 'email',
      title: faker.lorem.sentence(),
      to: faker.internet.email(),
    }).save();

    expect(job).to.exist;
    expect(job.data).to.exist;

    done();
  });

  it('should remove saved unique job and its associated data', (done) => {
    const uniqueKey = faker.random.uuid();
    let removed;

    waterfall(
      [
        (next) => {
          createJob({
            type: 'email',
            title: faker.lorem.sentence(),
            to: faker.internet.email(),
          })
            .unique(uniqueKey)
            .save(next);
        },

        (job, next) => {
          job.remove(next);
        },

        (job, next) => {
          expect(job).to.exist;
          removed = job;
          next(null, job);
        },

        (job, next) => {
          parallel(
            {
              job: (then) => {
                Job.get(job.id, (error, found) => {
                  expect(error).to.exist;
                  expect(error.message).to.be.equal(
                    `job "${removed.id}" doesnt exist`
                  );

                  then(null, found);
                });
              },
              data: (then) => {
                Job.getUniqueJobsData(then);
              },
            },
            next
          );
        },
      ],
      (error, results) => {
        expect(results.job).to.not.exist;
        expect(values(results.data)).to.not.contain(removed.id);

        done();
      }
    );
  });

  it('should remove non-unique jobs as normal', (done) => {
    let job = createJob({
      type: 'email',
      title: faker.lorem.sentence(),
      to: faker.internet.email(),
    });

    job = job.remove();

    expect(job).to.exist;
    expect(job.data).to.exist;

    done();
  });
});
