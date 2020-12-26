import { isNull, isNumber, find, first, forEach, keys, toNumber } from 'lodash';
import { waterfall } from 'async';
import Job from 'kue';

// TODO: honour other kue id types

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
 */
export const getUniqueJobsKey = () => {
  return Job.client.getKey('unique:jobs');
};

/**
 * @function getUniqueJobsKey
 * @name getUniqueJobsKey
 * @description Retrieved saved unique jobs data
 * @param {Function} done callback to invoke on success or failure
 * @returns {object} all unique jobs data
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 1.1.0
 * @version 0.1.0
 * @static
 * @public
 */
export const getUniqueJobsData = (done) => {
  // obtain unique jobs key
  const uniqueJobsKey = getUniqueJobsKey();

  // fetch unique jobs data
  return Job.client.hgetall(uniqueJobsKey, (error, results) => {
    // back-off on error
    if (error) {
      return done(error);
    }

    // process job data
    const data = isNull(results) ? {} : results;

    // deserialize string values to number
    // once fetched from redis
    forEach(data, (value, key) => {
      if (!Number.isNaN(value)) {
        data[key] = toNumber(value);
      }
    });

    // return fetched jobs data
    return done(null, data);
  });
};

/**
 * @function getUniqueJobData
 * @name getUniqueJobData
 * @description Retrieved saved unique job data
 * @param {string} unique unique job identifier
 * @param {Function} done callback to invoke on success or failure
 * @returns {object} unique job data
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 1.1.0
 * @version 0.1.0
 * @static
 * @public
 */
export const getUniqueJobData = (unique, done) => {
  // obtain unique jobs key
  const uniqueJobsKey = getUniqueJobsKey();

  return Job.client.hget(uniqueJobsKey, unique, (error, results) => {
    // back-off on error
    if (error) {
      return done(error);
    }

    // pick unique job data
    const data = {};

    // parse found job data
    if (results) {
      data[unique] = !Number.isNaN(data) ? toNumber(results) : results;
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
 */
export const saveUniqueJobsData = (uniqueJobData, done) => {
  // obtain unique jobs key
  const uniqueJobsKey = getUniqueJobsKey();

  // convert to field and job data
  const field = first(keys(uniqueJobData));
  const data = field ? uniqueJobData[field] : undefined;

  // save unique job data
  return Job.client.hset(uniqueJobsKey, field, data, (error) => {
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
 */
export const removeUniqueJobData = (jobId, done) => {
  // obtain unique jobs key
  const uniqueJobsKey = getUniqueJobsKey();

  // prepare tasks
  const loadUniqueJobsData = (next) => Job.getUniqueJobsData(next);
  const reloadUniqueJobsData = (next) => Job.getUniqueJobsData(next);

  const deleteJobData = (uniqueJobsData, next) => {
    // remove given job from unique job data
    // we have an id, lets find the unique key name.
    const uniqueKeys = keys(uniqueJobsData);
    const uniqueKey =
      find(uniqueKeys, (key) => {
        const actualId = uniqueJobsData[key];
        const comparedId = isNumber(actualId) ? toNumber(jobId) : jobId;
        return actualId === comparedId;
      }) || '';

    // remove unique job data
    return Job.client.hdel(uniqueJobsKey, uniqueKey, (
      error /* , response */
    ) => {
      return next(error);
    });
  };

  // remove job data
  const tasks = [loadUniqueJobsData, deleteJobData, reloadUniqueJobsData];
  return waterfall(tasks, done);
};

// attach static methods to Job
Job.getUniqueJobsKey = getUniqueJobsKey;
Job.getUniqueJobsData = getUniqueJobsData;
Job.getUniqueJobData = getUniqueJobData;
Job.saveUniqueJobsData = saveUniqueJobsData;
Job.removeUniqueJobData = removeUniqueJobData;
