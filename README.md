# kue-unique

[![Build Status](https://travis-ci.org/lykmapipo/kue-unique.svg?branch=master)](https://travis-ci.org/lykmapipo/kue-unique)
[![Dependencies Status](https://david-dm.org/lykmapipo/kue-unique.svg)](https://david-dm.org/lykmapipo/kue-unique)
[![Coverage Status](https://coveralls.io/repos/github/lykmapipo/kue-unique/badge.svg?branch=master)](https://coveralls.io/github/lykmapipo/kue-unique?branch=master)
[![GitHub License](https://img.shields.io/github/license/lykmapipo/kue-unique)](https://github.com/lykmapipo/kue-unique/blob/master/LICENSE)

[![Commitizen Friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Code Style](https://badgen.net/badge/code%20style/airbnb/ff5a5f?icon=airbnb)](https://github.com/airbnb/javascript)
[![npm version](https://img.shields.io/npm/v/kue-unique)](https://www.npmjs.com/package/kue-unique)

Unique job utility for [kue](https://github.com/Automattic/kue). If `job` already exists it will return it, otherwise it will create a new `job` and return it.

## Requirements

- [NodeJS v14.5+](https://nodejs.org)
- [Npm v6.14+](https://www.npmjs.com/)

## Installation

```sh
$ npm install --save kue kue-unique
```

## Usage

```js
import kue from 'kue-unique';
const queue = kue.createQueue();

// create and save unique job
const job = queue.create('email', {
    title: 'welcome email for tj'
  , to: 'tj@learnboost.com'
  , template: 'welcome-email'
})
.unique(<job_unique_identifier>)
.save((error, job) => {
   if( !error ) {
        console.log( job.id );
    }
});

// removing existing unique job
job.remove( (error, job) => {
   if( !error ) {
        console.log( job.id );
    }
})
```

## Testing

- Clone this repository

- Install all development dependencies

```sh
npm install
```

- Run example

```sh
npm run examples
```

- Then run test

```sh
npm test
```

## Contribute

It will be nice, if you open an issue first so that we can know what is going on, then, fork this repo and push in your ideas. Do not forget to add a bit of test(s) of what value you adding.

## License

The MIT License (MIT)

Copyright (c) lykmapipo & Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
