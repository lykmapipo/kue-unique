import * as Kue from 'kue';

export declare class Job extends Kue.Job {
  unique(uniqueKey: string): Job;
  log(str: string): Job;
  set(key: string, val: string, fn?: Function): Job;
  get(key: string, fn?: Function): Job;
  get(key: string, jobType: string, fn?: Function): Job;
  progress(complete: number, total: number, data?: any): Job;
  delay(ms: number | Date): Job;
  removeOnComplete(param: any): Job;
  backoff(param: any): Job;
  ttl(param: any): Job;
  priority(level: string | number): Job;
  priority(): number | string;
  attempt(fn: Function): Job;
  attempts(n: number): Job;
  searchKeys(keys: string[] | string): Job;
  remove(fn?: Function): Job;
  state(state: string, fn?: Function): Job;
  error(err: Error): Job;
  complete(fn?: Function): Job;
  failed(fn?: Function): Job;
  inactive(fn?: Function): Job;
  active(fn?: Function): Job;
  delayed(fn?: Function): Job;
  save(fn?: Function): Job;
  update(fn?: Function): Job;
  subscribe(fn?: Function): Job;
  events(events: boolean): Job;
}

export declare class Queue extends Kue.Queue {}
export declare class Worker extends Kue.Worker {}
export declare type ProcessCallback = Kue.ProcessCallback;
export declare type DoneCallback = Kue.DoneCallback;
export declare type JobCallback = Kue.JobCallback;
