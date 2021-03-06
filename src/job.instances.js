import {
  assign,
  first,
  isFunction,
  keys,
  merge,
  noop,
  size,
  values,
} from 'lodash';
import { parallel, waterfall } from 'async';
import { Job } from 'kue';

import './job.statics';

// for patching
const previousSave = Job.prototype.save;
const previousRemove = Job.prototype.remove;

/**
 * @function unique
 * @name unique
 * @description Extend job data with unique identifier
 * @param {string} uniqueKey a unique identifier for the job
 * @returns {Job} a job instance
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 1.1.0
 * @version 0.1.0
 * @instance
 * @public
 * @example
 * const job = queue.create('email', {
 *   title: 'welcome email for tj',
 *   to: 'tj@learnboost.com',
 *   template: 'welcome-email'
 *  })
 *  .unique(<job_unique_identifier>)
 */
export function unique(uniqueKey) {
  // ensure job data
  this.data = this.data || {};

  // extend job data with unique key
  merge(this.data, { unique: uniqueKey });

  return this;
}

/**
 * @function save
 * @name save
 * @description Save job and job unique data
 * @param {Function} done callback to invoke on success or failure
 * @returns {Job} a job instance
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 1.1.0
 * @version 0.1.0
 * @instance
 * @public
 * @example
 * const job = queue.create('email', {
 *   title: 'welcome email for tj',
 *   to: 'tj@learnboost.com',
 *   template: 'welcome-email'
 *  })
 *  .unique(<job_unique_identifier>)
 *  .save()
 *
 * // or
 *
 * const job = queue.create('email', {
 *   title: 'welcome email for tj',
 *   to: 'tj@learnboost.com',
 *   template: 'welcome-email'
 *  })
 *  .unique(<job_unique_identifier>)
 *  .save((error) => { ... })
 */
export function save(done) {
  // reference current job
  const job = this;

  // ensure callback
  const cb = done || noop;

  // tasks
  const tryGetExistingJobData = (next) => {
    Job.getUniqueJobData(job.data.unique, next);
  };

  const tryGetExistingOrSaveJob = (uniqueJobData, next) => {
    // try get existing job
    const exists = size(keys(uniqueJobData)) > 0;

    // get existing job
    if (exists) {
      const id = first(values(uniqueJobData));
      Job.get(id, (error, existing) => {
        // flag job as already exist
        if (existing) {
          assign(existing, { alreadyExist: true });
        }

        next(error, existing);
      });
    }

    // save a new job
    else {
      previousSave.call(job, (error) => {
        next(error, job);
      });
    }
  };

  const trySaveUniqueJobsData = (saved, next) => {
    // save job unique data
    const uniqueKey = job.data.unique;
    const jobId = saved.id;

    const uniqueJobData = {};
    uniqueJobData[uniqueKey] = jobId;

    Job.saveUniqueJobsData(uniqueJobData, (error /* ,uniqueJobsData */) => {
      next(error, saved);
    });
  };

  // check if job is unique
  const isUniqueJob = this.data && this.data.unique;

  // try save unique job with unique data
  if (isUniqueJob) {
    const tasks = [
      tryGetExistingJobData,
      tryGetExistingOrSaveJob,
      trySaveUniqueJobsData,
    ];
    return waterfall(tasks, cb);
  }

  // otherwise save a job

  return previousSave.call(job, cb);
}

/**
 * @function remove
 * @name remove
 * @description Remove job and job unique data
 * @param {Function} done callback to invoke on success or failure
 * @returns {Job} a job instance
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 1.1.0
 * @version 0.1.0
 * @instance
 * @public
 * @example
 * const job = queue.create('email', {
 *   title: 'welcome email for tj',
 *   to: 'tj@learnboost.com',
 *   template: 'welcome-email'
 *  })
 *  .unique(<job_unique_identifier>)
 *  .save()
 *
 * job.remove((error, job) => { ... });
 */
export function remove(done) {
  // reference current job
  const job = this;

  // ensure callback
  const cb = done || noop;

  // tasks
  const removeJob = (next) => previousRemove.call(job, next);
  const removeUniqueData = (next) => Job.removeUniqueJobData(job.id, next);

  // remove job and associated unique data
  if (isFunction(done)) {
    const tasks = { removeJob, removeUniqueData };
    return parallel(tasks, (error /* , results */) => {
      return cb(error, job);
    });
  }

  // return job instance
  return job;
}

// attach instance methods to Job
Job.prototype.unique = unique;
Job.prototype.save = save;
Job.prototype.remove = remove;
