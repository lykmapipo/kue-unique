const lodash = require('lodash');
const async = require('async');
const kue = require('kue');

const castToNumber = (value) => {
  const casted = lodash.toNumber(value);
  return Number.isNaN(casted) ? value : casted;
};

/**
 * @function getUniqueJobsKey
 * @name getUniqueJobsKey
 * @description Compute a key used to store unique jobs map
 * @returns {string} key to retrieve unique jobs map
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 1.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 * Job.getUniqueJobsKey(); //=> q:unique:jobs
 */
const getUniqueJobsKey = () => {
  return kue.Job.client.getKey('unique:jobs');
};

/**
 * @function getUniqueJobsData
 * @name getUniqueJobsData
 * @description Retrieved saved unique jobs data
 * @param {Function} done callback to invoke on success or failure
 * @returns {object} all unique jobs data
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 1.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 * Job.getUniqueJobsData((error, data) => { ... });
 */
const getUniqueJobsData = (done) => {
  // obtain unique jobs key
  const uniqueJobsKey = getUniqueJobsKey();

  // fetch unique jobs data
  return kue.Job.client.hgetall(uniqueJobsKey, (error, results) => {
    // back-off on error
    if (error) {
      return done(error);
    }

    // process job data
    const data = lodash.isNull(results) ? {} : results;

    // deserialize string values to number
    // once fetched from redis
    lodash.forEach(data, (value, key) => {
      data[key] = castToNumber(value);
    });

    // return fetched jobs data
    return done(null, data);
  });
};

/**
 * @function getUniqueJobData
 * @name getUniqueJobData
 * @description Retrieved saved unique job data
 * @param {string} uniqueKey unique job identifier
 * @param {Function} done callback to invoke on success or failure
 * @returns {object} unique job data
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 1.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 * Job.getUniqueJobData((error, data) => { ... });
 */
const getUniqueJobData = (uniqueKey, done) => {
  // obtain unique jobs key
  const uniqueJobsKey = getUniqueJobsKey();

  return kue.Job.client.hget(uniqueJobsKey, uniqueKey, (error, results) => {
    // back-off on error
    if (error) {
      return done(error);
    }

    // pick unique job data
    const data = {};

    // parse found job data
    if (results) {
      data[uniqueKey] = castToNumber(results);
    }

    // return fetched job data
    return done(null, data);
  });
};

/**
 * @function saveUniqueJobsData
 * @name saveUniqueJobsData
 * @description Save unique job data
 * @param {object} uniqueJobData unique job data to add to existing ones
 * @param {Function} done callback to invoke on success or failure
 * @returns {object} all unique jobs data
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 1.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 * Job.saveUniqueJobsData(data, (error, data) => { ... });
 */
const saveUniqueJobsData = (uniqueJobData, done) => {
  // obtain unique jobs key
  const uniqueJobsKey = getUniqueJobsKey();

  // convert to unique key and job data
  const uniqueKey = lodash.first(lodash.keys(uniqueJobData));
  const data = uniqueKey ? uniqueJobData[uniqueKey] : undefined;

  // save unique job data
  return kue.Job.client.hset(uniqueJobsKey, uniqueKey, data, (error) => {
    // back-off on error
    if (error) {
      return done(error);
    }

    // return current unique jobs data
    return getUniqueJobsData(done);
  });
};

/**
 * @function removeUniqueJobData
 * @name removeUniqueJobData
 * @description Remove unique jobs data
 * @param {number} jobId valid kue job id to remove from unique job datas
 * @param {Function} done callback to invoke on success or failure
 * @returns {object} all unique jobs data
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 1.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 * Job.removeUniqueJobData(1, (error, data) => { ... });
 */
const removeUniqueJobData = (jobId, done) => {
  // obtain unique jobs key
  const uniqueJobsKey = getUniqueJobsKey();

  // prepare tasks
  const loadUniqueJobsData = (next) => kue.Job.getUniqueJobsData(next);
  const reloadUniqueJobsData = (next) => kue.Job.getUniqueJobsData(next);

  const deleteJobData = (uniqueJobsData, next) => {
    // remove given job from unique job data
    // we have an id, lets find the unique key name.
    const uniqueKeys = lodash.keys(uniqueJobsData);
    const uniqueKey =
      lodash.find(uniqueKeys, (key) => {
        const actualId = uniqueJobsData[key];
        const comparedId = lodash.isNumber(actualId)
          ? lodash.toNumber(jobId)
          : jobId;
        return actualId === comparedId;
      }) || '';

    // remove unique job data
    return kue.Job.client.hdel(uniqueJobsKey, uniqueKey, (
      error /* , response */
    ) => {
      return next(error);
    });
  };

  // remove job data
  const tasks = [loadUniqueJobsData, deleteJobData, reloadUniqueJobsData];
  return async.waterfall(tasks, done);
};

// attach static methods to Job
kue.Job.getUniqueJobsKey = getUniqueJobsKey;
kue.Job.getUniqueJobsData = getUniqueJobsData;
kue.Job.getUniqueJobData = getUniqueJobData;
kue.Job.saveUniqueJobsData = saveUniqueJobsData;
kue.Job.removeUniqueJobData = removeUniqueJobData;

// for patching
const previousSave = kue.Job.prototype.save;
const previousRemove = kue.Job.prototype.remove;

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
function unique(uniqueKey) {
  // ensure job data
  this.data = this.data || {};

  // extend job data with unique key
  lodash.merge(this.data, { unique: uniqueKey });

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
function save(done) {
  // reference current job
  const job = this;

  // ensure callback
  const cb = done || lodash.noop;

  // tasks
  const tryGetExistingJobData = (next) => {
    kue.Job.getUniqueJobData(job.data.unique, next);
  };

  const tryGetExistingOrSaveJob = (uniqueJobData, next) => {
    // try get existing job
    const exists = lodash.size(lodash.keys(uniqueJobData)) > 0;

    // get existing job
    if (exists) {
      const id = lodash.first(lodash.values(uniqueJobData));
      kue.Job.get(id, (error, existing) => {
        // flag job as already exist
        if (existing) {
          lodash.assign(existing, { alreadyExist: true });
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

    kue.Job.saveUniqueJobsData(uniqueJobData, (error /* ,uniqueJobsData */) => {
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
    return async.waterfall(tasks, cb);
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
function remove(done) {
  // reference current job
  const job = this;

  // ensure callback
  const cb = done || lodash.noop;

  // tasks
  const removeJob = (next) => previousRemove.call(job, next);
  const removeUniqueData = (next) => kue.Job.removeUniqueJobData(job.id, next);

  // remove job and associated unique data
  if (lodash.isFunction(done)) {
    const tasks = { removeJob, removeUniqueData };
    return async.parallel(tasks, (error /* , results */) => {
      return cb(error, job);
    });
  }

  // return job instance
  return job;
}

// attach instance methods to Job
kue.Job.prototype.unique = unique;
kue.Job.prototype.save = save;
kue.Job.prototype.remove = remove;

module.exports = kue;
