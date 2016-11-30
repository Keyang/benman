#!/usr/bin/env node

var commander = require("commander");

commander.version(require("../package.json").version)
  .description("Benchmark / load testing endpoints with Postman collections.")
  .usage("<-b | -p> [options] <path>")
  .option("-b, --benman", "The benman config to run")
  // .command("collection")
  .option("-p, --postman", "The postman config to run")
  .option("-u, --usernumber <number>", "The number of concurrent simulated users. Default: 1")
  .option("-l, --loopnumber <number>", "Number of execution for each simulated user. Default: 5")
  .option("-r, --rampup <second>", "Ramp up period for simulated user. Default: 0")
  .option("-a, --aggregator <name>", "Name of result aggregator to use. Default: timeElapse")
  .option("--agent-url <agentUrl>", "Optional. the agent url connect to. If omitted, a local agent will be spawned.")
  .parse(process.argv);

var lib = require("../lib/");
var Benman = lib.Benman;
var benman = new lib.Benman();
var _ = require("lodash");
var path=require("path").resolve(commander.args[0]);
if (commander.benman) {
  var data = require(path);
  benman.importConfig(data);
} else if (commander.postman) {
  var data = require(path);
  var Unit = lib.Unit;
  var unit = new Unit({
    name: data.info.name,
    numberOfUser: parseInt(_.get(commander, "usernumber", 1)),
    rampUpPeriod: parseInt(_.get(commander, "rampup", 0)),
    loopCount: parseInt(_.get(commander, "loopnumber", 5)),
    aggregator: _.get(commander, "aggregator", "timeElapse"),
    "newmanOption": {
      collection: data
    }
  });

  benman.addUnit(unit);
} else {
  console.log("Either -b or -p should be provided.");
  commander.help();
  process.exit();
}

var cfg = benman.exportConfig();
var Agent = require("../lib/agent/Agent");
if (commander.agentUrl) {
  var agent = new Agent({
    url: commander.agentUrl
  });
  runOnAgent(agent, cfg);
} else {
  Agent.createLocalAgent()
    .then(function (agent) {
      runOnAgent(agent, cfg);
    })
}

function runOnAgent(agent, cfg) {
  agent.on("finish", function (agent, results) {
    agent.destroy(); 
    console.log(JSON.stringify(_.map(results, function (res) {
      var result = {
        "name": res.unit.name
      };
      result[res.unit.aggregator] = res.aggregatedResults;
      return result;
    }),null,2));
    
  });
  return agent.connect()
    .then(function () {
      return agent.getStatus();
    })
    .then(function (status) {
      if (status.status === "ready") {
        return agent.run(cfg);
      } else {
        throw (status.message);
      }
    })
}

// benman.on("done",function(){
//   console.log(_.map(benman.getUnits(),function(unit){
//     var result={
//       "name":unit.getName()
//     };
//     result[unit.getAggregatorName()]=unit.aggregateResult();
//     return result; 
//   })) 
// })

