# kue-unique

[![Build Status](https://travis-ci.org/lykmapipo/kue-unique.svg?branch=master)](https://travis-ci.org/lykmapipo/kue-unique)

Unique job utility for [kue](https://github.com/Automattic/kue). If `job` already exists it will return it, otherwise it will create a new `job` and return it.

*Note!:To ensure unique jobs, `save callback` and `remove callback` must be passed when working with unique job(s)*

*Warning!: There is data stucture change when moving from 0.1.x to 1.x. In 1.x `kue-unique` migrate to us redis hash to save unique job data instead on string.*

## Installation
```sh
$ npm install --save async lodash kue kue-unique
```

## Usage
```js
//load kue
var kue = require('kue-unique');
var queue = kue.createQueue();

//create and save unique job
var job = queue.create('email', {
    title: 'welcome email for tj'
  , to: 'tj@learnboost.com'
  , template: 'welcome-email'
})
.unique(<job_unique_identifier>)
.save( function(error, job){
   if( !error ) {
        console.log( job.id );
    }
});

//removing existing unique job
job.remove(function(error, job){
   if( !error ) {
        console.log( job.id );
    }
})
```

## Testing
* Clone this repository

* Install all development dependencies
```sh
$ npm install
```

* Then run test
```sh
$ npm test
```

## Contribute
It will be nice, if you open an issue first so that we can know what is going on, then, fork this repo and push in your ideas. Do not forget to add a bit of test(s) of what value you adding.


## License 

(The MIT License)

Copyright (c) 2011 lykmapipo && Contributors

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.