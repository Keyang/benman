module.exports=Worker;

var uuid = require("uuid");
var EventEmitter=require("events");
var util=require("util");
/**
 * A worker instance wrapping its underlying worker.js child process.
 * status:
 *  new -- new created
 *  pending -- opening 
 *  ready -- ready to use
 *  close -- closed 
 * 
 * Events:
 *  ready -- worker is ready to use 
 *  close -- worker is closed
 */
function Worker() {
  EventEmitter.call(this);
  this.status = "new";
  this.listeners = {};
  this.isEnabled=true;
  this.id=uuid();
}
util.inherits(Worker,EventEmitter);
Worker.prototype.isReady = function () {
  return this.status === "ready" && this.isEnabled;
}
/**
 * Open a worker. This function will do the worker initialisation and connect to it.
 * If a worker has already been opened, this function  will resolve promise immeidately.
 * @return Promise
 */
Worker.prototype.open = function () {
  var self = this;
  return new Promise(function (res, rej) {
    if (self.status != "new") {
      res();
    } else {
      self.status = "pending";
      self._c = require("child_process").fork(__dirname + "/worker.js", [], {
        env: process.env,
        stdio: [0, 1, 2]
      });
      self.dictateChildProcess();
      self.status = "ready";
      res();
    }
  });

}
/**
 * Execute a collection on the worker
 * @param options a newmanOption contains a collection to run
 * @return Promise
 */
Worker.prototype.request = function (options) {
  if (!this.isReady()) {
    return Promise.reject(new Error("Calling worker request which is not ready"));
  }
  var self = this;
  return new Promise(function (res, rej) {
    var id = uuid();
    self._c.send({
      cmd: "request",
      options: options,
      id: id
    });
    self.listeners[id] = res;
  });

}
Worker.prototype.dictateChildProcess = function () {
  if (this._c) {
    var self = this;
    this._c.on("error", function (err) {
      console.log(err);
    });
    this._c.on("close", function () {
      self.status = "close";
    });
    this._c.on("message", function (msg) {
      if (msg.cmd === "request_res") {
        var func = self.listeners[msg.id];
        if (func) {
          func(msg.result);
        }
      }
    })
  }
}

Worker.prototype.setEnable=function(isEnabled){
  this.isEnabled=isEnabled;
}


