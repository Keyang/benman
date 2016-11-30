#!/usr/bin/env node

var commander=require("commander");

commander.version(require("../package.json").version)
.description("Benman remote agent. Used with benman to perform remote load testing scripts. ")
.option("-h, --host <host>", "Network interface to listen on. Default: 0.0.0.0")
.option("-p, --port <port>", "The port to listen on. Default: 9901")
.option("-w, --workerNum <workerNum>","Number of local worker number. Default: 2")
.parse(process.argv)


var port=commander.port?parseInt(commander.port):9901;
var workerNumber=commander.workerNum?parseInt(commander.workerNum):2;
var host=commander.host?commander.host:"0.0.0.0";

var net=require("net");
var server=net.createServer({
    allowHalfOpen: false,
    pauseOnConnect: false
});
server.listen({
  host:host,
  port:port
},function(){ 
  require("../lib/agentHost").init(server,{
    "workerNum":workerNumber 
  });
  console.log("Benman agent is listening on: "+host+":"+port+". Worker number: "+workerNumber);
})


process.on("disconnect",function(){
  console.log("Parent killed");
  process.exit();
})