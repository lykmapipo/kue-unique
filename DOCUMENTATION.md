#### getUniqueJobsKey()

Compute a key used to store unique jobs map

##### Examples

```javascript
Job.getUniqueJobsKey(); //=> q:unique:jobs
```

##### Returns

- `string` key to retrieve unique jobs map

#### getUniqueJobsData(done)

Retrieved saved unique jobs data

##### Parameters

| Name | Type       | Description                              |        |
| ---- | ---------- | ---------------------------------------- | ------ |
| done | `Function` | callback to invoke on success or failure | &nbsp; |

##### Examples

```javascript
Job.getUniqueJobsData((error, data) => { ... });
```

##### Returns

- `object` all unique jobs data

#### getUniqueJobData(uniqueKey, done)

Retrieved saved unique job data

##### Parameters

| Name      | Type       | Description                              |        |
| --------- | ---------- | ---------------------------------------- | ------ |
| uniqueKey | `string`   | unique job identifier                    | &nbsp; |
| done      | `Function` | callback to invoke on success or failure | &nbsp; |

##### Examples

```javascript
Job.getUniqueJobData((error, data) => { ... });
```

##### Returns

- `object` unique job data

#### saveUniqueJobsData(uniqueJobData, done)

Save unique job data

##### Parameters

| Name          | Type       | Description                              |        |
| ------------- | ---------- | ---------------------------------------- | ------ |
| uniqueJobData | `object`   | unique job data to add to existing ones  | &nbsp; |
| done          | `Function` | callback to invoke on success or failure | &nbsp; |

##### Examples

```javascript
Job.saveUniqueJobsData(data, (error, data) => { ... });
```

##### Returns

- `object` all unique jobs data

#### removeUniqueJobData(jobId, done)

Remove unique jobs data

##### Parameters

| Name  | Type       | Description                                      |        |
| ----- | ---------- | ------------------------------------------------ | ------ |
| jobId | `number`   | valid kue job id to remove from unique job datas | &nbsp; |
| done  | `Function` | callback to invoke on success or failure         | &nbsp; |

##### Examples

```javascript
Job.removeUniqueJobData(1, (error, data) => { ... });
```

##### Returns

- `object` all unique jobs data

#### unique(uniqueKey)

Extend job data with unique identifier

##### Parameters

| Name      | Type     | Description                     |        |
| --------- | -------- | ------------------------------- | ------ |
| uniqueKey | `string` | a unique identifier for the job | &nbsp; |

##### Examples

```javascript
const job = queue.create('email', {
  title: 'welcome email for tj',
  to: 'tj@learnboost.com',
  template: 'welcome-email'
 })
 .unique(<job_unique_identifier>)
```

##### Returns

- `Job` a job instance

#### save(done)

Save job and job unique data

##### Parameters

| Name | Type       | Description                              |        |
| ---- | ---------- | ---------------------------------------- | ------ |
| done | `Function` | callback to invoke on success or failure | &nbsp; |

##### Examples

```javascript
const job = queue.create('email', {
  title: 'welcome email for tj',
  to: 'tj@learnboost.com',
  template: 'welcome-email'
 })
 .unique(<job_unique_identifier>)
 .save()

// or

const job = queue.create('email', {
  title: 'welcome email for tj',
  to: 'tj@learnboost.com',
  template: 'welcome-email'
 })
 .unique(<job_unique_identifier>)
 .save((error) => { ... })
```

##### Returns

- `Job` a job instance

#### remove(done)

Remove job and job unique data

##### Parameters

| Name | Type       | Description                              |        |
| ---- | ---------- | ---------------------------------------- | ------ |
| done | `Function` | callback to invoke on success or failure | &nbsp; |

##### Examples

```javascript
const job = queue.create('email', {
  title: 'welcome email for tj',
  to: 'tj@learnboost.com',
  template: 'welcome-email'
 })
 .unique(<job_unique_identifier>)
 .save()

job.remove((error, job) => { ... });
```

##### Returns

- `Job` a job instance

_Documentation generated with [doxdox](https://github.com/neogeek/doxdox)._
