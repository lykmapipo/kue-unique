// dependencies
const kue = require('kue');
const async = require('async');

// redis client for database cleanups
const redis = kue.redis.createClientFactory({
  redis: {},
});

/**
 * @param {Function} callback invoked on success or failure
 */
function cleanup(callback) {
  redis.keys('q*', (error, rows) => {
    if (error) {
      callback(error);
    } else {
      async.each(
        rows,
        (row, next) => {
          redis.del(row, next);
        },
        callback
      );
    }
  });
}

before((done) => {
  // clean any previous data
  // if any
  cleanup(done);
});

after((done) => {
  // clean all data
  // introduced with these specs
  cleanup(done);
});
