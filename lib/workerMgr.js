/**
 * Worker manager module takes care of all local worker processes.
 * worker is used by User component to send a request and parse response
 * Each worker is a standalone process
 * the number of worker should be decided by the number of cpu cores. (ideally cpu core -1)
 * Methods:
 * 
 *  init(localWorkerCfg) init with worker definition {wokerNum:Integer}
 *  getWorker() returns a promise which resolves a "ready" to work worker using round-robin algorithm. It will automatically open the worker if it is not opened
 *  getWorkerNumber() returns a number of current workers
 */
var EventEmiter = require("events");
var workerMgr = module.exports = new EventEmiter();

workerMgr.init = init;
workerMgr.getWorker = getWorker;
workerMgr.getWorkerNumber = getWorkerNumber;
var Worker = require("./Worker");
var workers = [];
var Promise=require("bluebird");
function init(cfg) {
  for (var i = 0; i < cfg.workerNum; i++) {
    var w = new Worker();
    workers.push(w);
    //TODO add error handler to respawn worker if dead.
    w.open();
  }
  return Promise.resolve();
}

function getWorker() {
  return new Promise(function (res, rej) {
    var w = workers.shift();
    workers.push(w);
    if (w.isReady()) {
      res(w);
    } else {
      //TODO check no ready worker
      w.open();
      setTimeout(function () {
        getWorker().then(res, rej);
      }, 10);
    }
  });
}
function getWorkerNumber(){
  return workers.length;
}