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
var noop = function() {};


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
 * @description retrieved saved unique job data
 * @param {String} unique a unique job identifier
 * @param {Function} done a callback to invoke on success or error
 * @return {Object} unique jobs data
 * @public
 */
Job.getUniqueJobData = function(unique, done) {

    async.waterfall([

        function loadUniqueJobsData(next) {
            Job.getUniqueJobsData(next);
        },

        function findUniqueData(uniqueJobsData, next) {
            //pick unique job data
            var uniqueJobData = _.pick(uniqueJobsData, unique);
            next(null, uniqueJobData);
        }

    ], done);
};

/**
 * @function
 * @description remove unique jobs data into redis backend
 * @param {Number} id job id to remove from unique job datas
 * @param {Function} done a callback to invoke on success or error
 * @return {Object} unique jobs data
 * @private
 */
Job.removeUniqueJobData = function(id, done) {

    var key = Job.getUniqueJobsKey();

    async.waterfall([

        function loadUniqueJobsData(next) {
            Job.getUniqueJobsData(next);
        },

        function save(uniqueJobsData, next) {
            //remove given job from unique job data
            uniqueJobsData = _.omit(uniqueJobsData, function(value) {
                return value === id;
            });

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


//patch job save with unique checkup
var previousSave = Job.prototype.save;
Job.prototype.save = function(done) {
    /*jshint validthis:true*/
    var self = this;

    //correct callback
    done = done || noop;

    //if job is unique
    if (self.data && self.data.unique) {
        //check if it already exist
        async.waterfall([

            function tryGetExistingJobData(next) {
                Job.getUniqueJobData(self.data.unique, next);
            },

            function tryGetExistingOrSaveJob(uniqueJobData, next) {
                //try get existing job
                var exists = _.size(_.keys(uniqueJobData)) > 0;

                if (exists) {
                    //get existing job
                    var id = _.first(_.values(uniqueJobData));
                    Job.get(id, next);
                }

                //save a new job
                else {
                    previousSave.call(self, function(error) {
                        next(error, self);
                    });
                }
            },

            function _saveUniqueJobsData(job, next) {
                //save job unique data
                var uniqueJobData = {};
                uniqueJobData[job.data.unique] = job.id;

                Job.saveUniqueJobsData(uniqueJobData, function(error /*,uniqueJobsData*/ ) {
                    next(error, job);
                });
            }

        ], function(error, job) {
            self = job;
            return done(error, job);
        });
    }

    //otherwise save a job
    else {
        return previousSave.call(self, done);
    }
};

//patch job remove with unique checkup
var previousRemove = Job.prototype.remove;
Job.prototype.remove = function(done) {
    /*jshint validthis:true*/
    var self = this;

    //correct callback
    done = done || noop;

    async.parallel({

        removeJob: function(next) {
            previousRemove.call(self, next);
        }.bind(self),

        removeUniqueData: function(next) {
            Job.removeUniqueJobData(self.id, next);
        }.bind(self)

    }, function finalize(error /*, results*/ ) {
        done(error, self);
    }.bind(self));

    return this;
};

/**
 * @description export kue with job unique behavior attached to job
 * @type {Function}
 */
module.exports = kue;