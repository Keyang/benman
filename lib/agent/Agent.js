module.exports = Agent;

var NetTransporter = require("./NetTransporter");
var util = require("util");
var Promise = require("bluebird");
var uuid = require("uuid");
var net = require("net");
var resultParser=require("../resultParser");
/**
 * Agent is a unit where benman script being running on.
 * An agent can only run ONE benman script at a time.
 * benman run - > choose agent  - > connect agent -> check agent status -> run benman-> (emit progress) -> finish running -> disconnect
 * Events 
 *  error - any error happens
 *  progress - progress of running a benman script 
 *  finish - finish running a benman script
 */
function Agent(cfg) {
  NetTransporter.call(this);
  this.cfg = cfg;
  this.lastBenmanCfg = null;
  this.lastProgress = null;
  this.lastResult=null;
  this.host = cfg.url;
  this.running = false;
  this.destroyed=false;
}
util.inherits(Agent, NetTransporter);
Agent.localAgents=[];
Agent.createLocalAgent = function (cfg) {
  var freeport = require("freeport");
  if (!cfg){
    cfg={};
  }
  return Promise.promisify(freeport)()
    .then(function (port) {
      return new Promise(function (res, rej) {
        cfg.url = "127.0.0.1:" + port;
        var agent = new Agent(cfg);
        var _c = require("child_process").spawn(__dirname + "/../../bin/benman-agent.js",
          ["-p", port,"-w",cfg.workerNum || 2],
          {
            env:process.env,
            stdio:[0,"pipe",2]
          }
        );
        agent._c=_c;
        _c.stdout.on("data", function (d) {
          d = d.toString();
          if (d.indexOf("listening on") > -1) {
            res(agent);
          }
          console.log(d);
        });
        Agent.localAgents.push(agent);
        
      });
    });
}
Agent.prototype.destroy=function(){
  this.clear();
  if (this._c){
    this._c.kill();
    this._c=null;
  }
  this.destroyed=true;
}
Agent.prototype.getStatus = function () {
  return this.sendCmd("status");
};
Agent.prototype.run = function (benmanCfg) {
  if (this.running) {
    return Promise.reject("Previous running in progress..");
  }
  this.running = true;
  this.lastBenmanCfg = benmanCfg;
  return this.sendCmd("run", benmanCfg);
};
Agent.prototype.getName = function () {
  return this.cfg.name;
}

/**
 * ========================================
 * = Below are cmd handler for agent host =
 * ========================================
 */
/**
 * called when progress made on agent host
 */
Agent.prototype.handler_progress = function (progress) {
  this.lastProgress = progress;
  this.emit("progress", this, progress);
}

Agent.prototype.handler_finish = function (result) {
  // this.lastResults = result.results;
  // this.lastAggregatedReusults = result.aggregatedResults;
  result=resultParser.parseBenmanResult(result); 
  this.running = false;
  this.lastResult=result;
  this.emit("finish", this,result);
}

Agent.prototype.handler_error = function (errStr) {
  this.emit("error", this, new Error(errStr));
  this.disconnect();
}