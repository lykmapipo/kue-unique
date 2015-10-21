'use strict';

/**
 * @description example of ensuring unique job
 */

//dependencies
var path = require('path');

//require('kue-unique') here
var kue = require(path.join(__dirname, '..', 'index'));
var q = kue.createQueue();


//processing jobs
var counter = 0;
q.process('single', function(job, done) {
    counter++;

    console.log('\n-------------------------' + counter + '---------------------------');
    console.log('Processing job with id %s at %s', job.id, new Date());
    console.log('-------------------------' + counter + '---------------------------');

    done(null, {
        deliveredAt: new Date()
    });

    //update a job for next execution
    setTimeout(function(argument) {
        job.inactive();
    }, 2000);

});


//prepare a job to perform
var job = q.createJob('single', {
        to: 'any'
    })
    .attempts(3)
    .backoff({
        delay: 60000,
        type: 'fixed'
    })
    .unique('single')
    .priority('normal');


//schedule a unique job then
job.save(function(error, job) {
    if (error) {
        console.log(error);
    } else {
        console.log(job.id);
    }
});