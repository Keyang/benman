module.exports = Unit;
var EventEmitter = require("events");
var util = require("util");
var User = require("./User");
var Collection = require("postman-collection").Collection;
/**
 * A unit spawns users to execute a postman collection
 * Events:
 *  result -- a user has reported a result for running a collection one time.  
 *  user_spawn -- a user has been spawn 
 *  user_done --  a user has finished its job
 *  done -- this unit has done;
 */
function Unit(unitParam) {
  EventEmitter.call(this);
  this.params = unitParam;
  this.params.newmanOption.id = require("uuid")();
  this.stopped = false;
  this.finishedUser = 0;
  this.users = [];
  this.results = [];
  this.started = false;
}
util.inherits(Unit, EventEmitter);
Unit.prototype.getAggregator = function () {
  var aggName = this.params.aggregator;
  var def={
    map:function(item){return item},
    reduce:function(item){return item}
  }
  if (aggName){
    try{
      return require("./aggregators/" + aggName);
    }catch(e){
      console.error(e);
      return def;
    }
  }else{
    return def;
  }
}
Unit.prototype.start = function () {
  if (this.started) {
    return;
  }
  this.started = true;
  this.spawnUser();
}

Unit.prototype.stop = function () {
  this.stopped = true;
  this.users.forEach(function (u) {
    u.stop();
  });
}
Unit.prototype.getParams = function () {
  return this.params;
}

Unit.prototype.spawnUser = function () {
  if (this.users.length < this.params.numberOfUser) {
    //spawn user
    var user = new User(this.params);
    this.dictateUser(user);
    this.users.push(user);
    var self = this;
    this.emit("user_spawn", this, user);
    setTimeout(function () {
      self.spawnUser();
    }, this.params.rampUpPeriod * 1000);
  }
}

Unit.prototype.isInfinite = function () {
  return this.params.loopCount === -1;
}

Unit.prototype.dictateUser = function (user) {
  var self = this;
  user.on("result", function (u, result) {
    self.emit("result", self, result);
    self.results.push(result);
  });
  user.on("done", function (u) {
    self.emit("user_done", self, u);
    self.finishedUser++;
    if (self.getActiveUserNumber() === 0) {
      if (self.stopped || self.getTotalUserNumber() === self.getSpawnedUserNumber()) {
        self.stopped = true;
        self.emit("done");
      }
    }
  });
  user.start();
}

Unit.prototype.getTotalUserNumber = function () {
  return this.params.numberOfUser;
}
Unit.prototype.getSpawnedUserNumber = function () {
  return this.users.length;
}
Unit.prototype.getActiveUserNumber = function () {
  var count = 0;
  this.users.forEach(function (u) {
    if (u.isActive()) count++;
  });
  return count;
}
Unit.prototype.getAllUsers = function () {
  return this.users;
}

Unit.prototype.getResults = function () {
  return this.results;
}
Unit.prototype.isRunning = function () {
  return this.started && !this.stopped;
}

Unit.prototype.aggregateResult = function () {
  var agg = this.getAggregator();
  if (agg){
    return agg.reduce(agg.map(this.getResults()));
  }else{
    return null;
  }
}
Unit.prototype.getName = function () {
  return this.params.name;
}
Unit.prototype.getAggregatorName = function () {
  return this.params.aggregator;
}