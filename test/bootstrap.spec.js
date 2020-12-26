import { createQueue, clear, stop } from '@lykmapipo/kue-common';

before(() => {
  createQueue();
});

before((done) => {
  clear(done);
});

after((done) => {
  clear(done);
});

after((done) => {
  stop(done);
});
