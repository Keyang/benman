/**
 * Agent manager module takes care of all agents and their workers.
 * An agent (local or remote) could have multipler workers. Each worker is a separetd process running on agent.
 * 
 * Methods:
 * 
 *  init(agents) init will take an array of agent definition
 *  getWorker() returns a promise which resolves a "ready" to work worker using round-robin algorithm. It will automatically open the worker if it is not opened.
 *  registerAgent(agentCfg) returns a promise. This funciton register a agent (local or remote). Only the agent's resolves promise successfully will add the workers to repo.
 */
var EventEmiter = require("events");
/**
 * Events:
 *  agent_add: an agent has been added
 *  agent_remote: an agent has been removed 
 *  agent_update: an agent has been updated
 *  error: error happened 
 *  agent_job_done: an agent has done its job
 *  job_done: all job done
 */
var agentMgr = module.exports = new EventEmiter();

agentMgr.importCfg = importCfg;
agentMgr.registerAgent = registerAgent;
agentMgr.getWorker = getWorker;
agentMgr.runJob = runJob;
agentMgr.stopJob = stopJob;
agentMgr.getLocalAgent = getLocalAgent;
agentMgr.getResults=getResults;
agentMgr.getConfig=getConfig;

var LocalAgent = require("./agent/LocalAgent");
var RemoteAgent = require("./agent/RemoteAgent");
var Promise = require("bluebird");
var util = require("util");
var _=require("lodash");
// var agents=require("./agents");
var localAgent = null;
var remoteAgents = [];
var agentDone=0;
var totalAgent=0;
function getConfig(){
  _.map(allAgents(),function(agent){
    return _.cloneDeep(agent.cfg);
  });
}
function registerAgent(agentCfg) {
  var agent = null;
  if (agentCfg.url == "local") {
    agent = new LocalAgent(agentCfg);
    localAgent = agent;
  } else {
    agent=new RemoteAgent(agentCfg);
    remoteAgents.push(agent);
  }
  dictateAgent(agent);
  return agent.init();
}
function allAgents(){
  return [localAgent].concat(remoteAgents);
}
function dictateAgent(agent){
  agent.on("job_done",function(agent){
    agentMgr.emit("agent_job_done",agent);
    agentDone++;
    if (totalAgent === agentDone){
      agentMgr.emit("job_done",agentMgr);
      totalAgent=0;
      agentDone=0;
    }
  });
}
function importCfg(cfg) {
  if (cfg && cfg instanceof Array) {
    cfg.forEach(function (c) {
      registerAgent(c);
    });
  }
}

function getWorker() {
  return new Promise(function (res, rej) {
    if (localAgent === null || localAgent.getAllWorkers().length === 0) {
      rej(new Error("No local agent found or no worker registered for local agent."));
    } else {
      var workers = localAgent.getAllWorkers();
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
    }
  });
}
/**
 * Run job will first distribute job to all agents according to their weights
 * then tell each agent to run.
 */
function runJob(benmanCfg) {
  var clonned = _.cloneDeep(benmanCfg);
  var idx = 0;
  var agents=allAgents();
  var totalWeight = getTotalWeight();
  if (totalWeight > 0 && agents.length >0) {
    while (clonned.units.length > 0) {
      var pos =  idx % agents.length;
      var agent = agents[pos];
      clonned = runJobRecuce(clonned, agent, totalWeight);
      idx++;
      totalAgent++;
      if (totalAgent > agents.length){
        agentMgr.emit("error",new Error("Job distribution failed."));
        break;
      }
    }
  }else{
    agentMgr.emit("error",new Error("No agent or all agents have weight as 0."));
  }
}

function runJobRecuce(cfg, agent, totalWeight) {
  var agentWeight = agent.getWeight();

  var ratio = agentWeight / totalWeight;
  if (ratio > 0) {
    var clonned = _.cloneDeep(cfg);
    _.each(clonned.units, function (unitCfg, idx) {
      if (unitCfg.numberOfUser > 0) {
        var numberOfUser = Math.round(unitCfg.numberOfUser * ratio);
        if (numberOfUser === 0) {
          numberOfUser = 1;
        }
        unitCfg.numberOfUser = numberOfUser;
        cfg.units[idx].numberOfUser -= numberOfUser;
      }
    });
    cfg.units = _.filter(cfg.units, function (unit) {
      return unit.numberOfUser > 0;
    });
    agent.setJob(clonned)
    .then(function(){
      return agent.runJob();
    })
    .then(null,function(err){
      agentMgr.emit("error",err);
    });
  }

  return cfg;
}

function stopJob() {

}

function getTotalWeight() {
  return _.reduce(allAgents(), function (sum, agent) {
    return sum + agent.getWeight();
  }, 0);
}




function getLocalAgent(){
  return localAgent;
}
function getResults(){
  return Promise.reduce(allAgents(),function(res,agent){
    return res.concat(agent.getResults());
  },[]);
}