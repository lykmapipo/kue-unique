'use strict';

/**
 * @module
 * @name kue-unique
 * @description Unique job utility for kue
 * @return {kue} a patched kue with unique job capabilities
 * @public
 */


//dependencies
var kue = require('kue');
var Job = kue.Job;
var _ = require('lodash');
var async = require('async');
var noop = function () {};


/**
 * @function
 * @description compute a key used to store unique jobs map
 * @return {String} a key to retrieve unique jobs map
 * @private
 */
Job.getUniqueJobsKey = function () {
  return Job.client.getKey('unique:jobs');
};


/**
 * @function
 * @description retrieved saved unique jobs data from redis backend
 * @param {Function} done a callback to invoke on success or error
 * @return {Object} unique jobs data
 * @private
 */
Job.getUniqueJobsData = function (done) {

  var key = this.getUniqueJobsKey();
  Job
    .client
    .hgetall(key, function (error, data) {

      //correct null
      if (_.isNull(data)) {
        data = {};
      } else {
        //deserialize string to number
        //once fetched from redis
        _.forEach(data, function (value, key) {
          if (!isNaN(value)) {
            data[key] = parseInt(value);
          }
        });
      }

      done(error, data);

    });
};


/**
 * @function
 * @description retrieved saved unique job data
 * @param {String} unique a unique job identifier
 * @param {Function} done a callback to invoke on success or error
 * @return {Object} unique jobs data
 * @private
 */
Job.getUniqueJobData = function (unique, done) {

  var key = this.getUniqueJobsKey();

  Job.client.hget(key, unique, function (error, data) {
    //pick unique job data
    var uniqueJobData = {};

    if (data) {

      if (!isNaN(data)) {
        data = parseInt(data);
      }

      uniqueJobData[unique] = data;
    }

    done(null, uniqueJobData);

  });

};


/**
 * @function
 * @description remove unique jobs data from redis backend
 * @param {Number} id job id to remove from unique job datas
 * @param {Function} done a callback to invoke on success or error
 * @return {Object} unique jobs data
 * @private
 */
Job.removeUniqueJobData = function (id, done) {

  var key = Job.getUniqueJobsKey();

  async.waterfall([

    function loadUniqueJobsData(next) {
      Job.getUniqueJobsData(next);
    },

    function dosave(uniqueJobsData, next) {
      //remove given job from unique job data
      //we have an id, lets find the key name.
      //
      var unique = Object.keys(uniqueJobsData).filter(function (key) {
        return uniqueJobsData[key] === id;
      })[0];

      Job
        .client
        .hdel(key, unique || '', function (error /*, response*/ ) {
          next(error);
        });
    },

    function reloadUniqueJobsData(next) {
      Job.getUniqueJobsData(next);
    }

  ], done);

};


/**
 * @function
 * @description save unique jobs data into redis backend
 * @param {Object} uniqueJobData unique job data to add to existing ones
 * @param {Function} done a callback to invoke on success or error
 * @return {Object} unique jobs data
 * @private
 */
Job.saveUniqueJobsData = function (uniqueJobData, done) {

  var key = Job.getUniqueJobsKey();

  var field;
  if (Object.keys(uniqueJobData).length > 0) {
    field = Object.keys(uniqueJobData)[0];
  }

  Job
    .client
    .hset(key, field, uniqueJobData[field], function (error /*,response*/ ) {

      if (error) {
        return done(error, null);
      } else {

        Job.getUniqueJobsData(done);
      }

    });

};



/**
 * @description extend job data with unique identifier
 * @param  {String} unique a unique identifier for the job
 * @return {Job}        job instance
 */
Job.prototype.unique = function (unique) {

  //extend job data with unique key
  _.merge(this.data || {}, {
    unique: unique
  });

  return this;

};


//patch job save with unique checkup
var previousSave = Job.prototype.save;
Job.prototype.save = function (done) {
  //correct callback
  done = done || noop;

  //if job is unique
  var isUniqueJob = this.data && this.data.unique;
  if (isUniqueJob) {
    //check if it already exist
    async.waterfall([

      function tryGetExistingJobData(next) {
        Job.getUniqueJobData(this.data.unique, next);
      }.bind(this),

      function tryGetExistingOrSaveJob(uniqueJobData, next) {
        //try get existing job
        var exists = _.size(_.keys(uniqueJobData)) > 0;

        if (exists) {
          //get existing job
          var id = _.first(_.values(uniqueJobData));
          Job.get(id, function (error, job) {

            //flag job as already exist
            if (job) {
              job.alreadyExist = true;
            }

            next(error, job);

          });
        }

        //save a new job
        else {

          previousSave.call(this, function (error) {
            next(error, this);
          }.bind(this));

        }

      }.bind(this),

      function _saveUniqueJobsData(job, next) {
        //save job unique data
        var uniqueJobData = {};

        uniqueJobData[job.data.unique] = job.id;

        Job.saveUniqueJobsData(uniqueJobData, function (error /*,uniqueJobsData*/ ) {
          next(error, job);
        });
      }

    ], function (error, job) {
      return done(error, job);
    });

  }

  //otherwise save a job
  else {
    return previousSave.call(this, done);
  }

};


//patch job remove with unique checkup
var previousRemove = Job.prototype.remove;
Job.prototype.remove = function (done) {
  //correct callback
  done = done || noop;

  async.parallel({

    removeJob: function (next) {
      previousRemove.call(this, next);
    }.bind(this),

    removeUniqueData: function (next) {
      Job.removeUniqueJobData(this.id, next);
    }.bind(this)

  }, function finalize(error /*, results*/ ) {
    done(error, this);
  }.bind(this));

  return this;
};


/**
 * @description export kue with job unique behavior attached to job
 * @type {Function}
 */
module.exports = kue;
