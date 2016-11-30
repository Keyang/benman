module.exports = User;
var EventEmitter = require("events");
var util = require("util");
// var newman = require("newman");
var _=require("lodash");
var workerMgr=require("./workerMgr");
/**
 * A user instance simulates a person to execute specific Postman collection 
 * Events:
 *  result - current user has finished one postman collection execution (this, summary)
 *  done - current user has done the job;
 */
function User(unitParam) {
  EventEmitter.call(this);
  this.params = unitParam;
  this.finished = false;
  this.currentLoop = 0;
  this.results = [];
  this.started = false;
}
util.inherits(User, EventEmitter);

User.prototype.start = function () {
  if (this.started) {
    return;
  }
  this.started = true;
  this.loop();
}
var counter = 0;
User.prototype.stop = function () {
  this.finished = true;
}
User.prototype.loop = function () {
  if (this.finished === false &&
    (this.getTotalLoop() === -1 || this.getCurrentLoop() < this.getTotalLoop())
  ) {
    var newmanOption = this.params.newmanOption;
    this.currentLoop++;
    var self = this;
    // setTimeout(function(){
    //   self.results.push({});
    //   self.emit("result",self,{});
    //   self.loop();
    // },1100);
    var start ;
    workerMgr.getWorker()
    .then(function(worker){
      start=new Date();
      return worker.request(newmanOption);
    })
    .then(function(res){
      var result={
        hasError:res.hasError,
        summary:res.summary,
        totalResponseTime:res.totalResponseTime,
        endTime:new Date().getTime(),
        startTime:start.getTime()
      } 
      self.results.push(result);
      self.emit("result", self, result);
      self.loop();
    });
    // newman.run(newmanOption,function(err,summary){
    //   counter--;
    //   console.log("finish",counter,start.getTime(),new Date().getTime()-start.getTime());
    //   self.results.push(summary);
    //   self.emit("result",self,summary);
    //   self.loop();
    // });
  } else {
    this.finished = true;
    this.emit("done", this);
  }
}

User.prototype.isActive = function () {
  return !this.finished;
}

User.prototype.getResults = function () {
  return this.results;
}

User.prototype.getCurrentLoop = function () {
  return this.currentLoop;
}

User.prototype.getTotalLoop = function () {
  return this.params.loopCount;
}

