import kue from '../src/index';

const q = kue.createQueue();

// processing jobs
let counter = 0;
q.process('single', (job, done) => {
  counter += 1;

  console.log(
    `\n-------------------------${counter}---------------------------`
  );
  console.log('Processing job with id %s at %s', job.id, new Date());
  console.log(`-------------------------${counter}---------------------------`);

  done(null, {
    deliveredAt: new Date(),
  });

  // update a job for next execution
  setTimeout(() => {
    job.inactive();
  }, 2000);
});

// prepare a job to perform
const job = q
  .createJob('single', {
    to: 'any',
  })
  .attempts(3)
  .backoff({
    delay: 60000,
    type: 'fixed',
  })
  .unique('single')
  .priority('normal');

// schedule a unique job then
job.save((error, saved) => {
  if (error) {
    console.log(error);
  } else {
    console.log(saved.id);
  }
});
