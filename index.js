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


/**
 * @function
 * @description compute a key used to store unique jobs map
 * @return {String} a key to retrieve unique jobs map
 * @public
 */
Job.getUniqueJobsKey = function() {
    return Job.client.getKey('unique:jobs');
};


/**
 * @function
 * @description retrieved saved unique jobs data from redis backend
 * @param {Function} done a callback to invoke on success or error
 * @return {Object} unique jobs data
 * @public
 */
Job.getUniqueJobsData = function(done) {
    var key = Job.getUniqueJobsKey();

    Job
        .client
        .get(key, function(error, data) {

            try {
                data = JSON.parse(data);
            } catch (e) {
                data = {};
            }
            
            //corrent null
            if (_.isNull(data)) {
                data = {};
            }

            done(error, data);
        });
};


/**
 * @function
 * @description save unique jobs data into redis backend
 * @param {Object} uniqueJobData unique job data to add to existing ones
 * @param {Function} done a callback to invoke on success or error
 * @return {Object} unique jobs data
 * @private
 */
Job.saveUniqueJobsData = function(uniqueJobData, done) {

    var key = Job.getUniqueJobsKey();

    async.waterfall([
        function loadUniqueJobsData(next) {
            Job.getUniqueJobsData(next);
        },
        function save(uniqueJobsData, next) {
            uniqueJobsData = _.merge(uniqueJobsData, uniqueJobData);

            Job
                .client
                .set(key, JSON.stringify(uniqueJobsData),
                    function(error /*, response*/ ) {
                        next(error, uniqueJobsData);
                    });
        }
    ], done);
};



/**
 * @description extend job data with unique identifier
 * @param  {String} unique a unique identifier for the job
 * @return {Job}        jib instance
 */
Job.prototype.unique = function(unique) {
    //extend job data with unique key
    _.merge(this.data || {}, {
        unique: unique
    });
    return this;
};


//patch job save with unique ability checkup
var save = Job.prototype.save;
Job.prototype.save = function(fn) {
    //if job is unique
    //check if it already exist
    //and return it
    if (this.data && this.data.unique) {

    }

    //otherwise save a job
    else {
        save.call(this, fn);
    }
};


/**
 * @description export kue with job unique behavior attached to job
 * @type {Function}
 */
module.exports = kue;