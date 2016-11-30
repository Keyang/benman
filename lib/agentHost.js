/**
 * remoteAgentHost is a tcp based server waiting for master connecting and distributing jobs.
 */
module.exports = {
  init: init
}
var workerMgr = require("./workerMgr");
var Benman=require("./Benman");
function init(server, workerCfg) {
  workerMgr.init(workerCfg);
  server.on("connection", function (socket) {
    var session=new Session(socket);
    sessions.push(session);
  });
  server.on("error", function (err) {
    throw (err);
  });
}
var sessions = [];
var NetTransporter=require("./agent/NetTransporter");
var util=require("util");
function Session(socket) {
  NetTransporter.call(this);
  this.attachSocket(socket);
  this.socket = socket;
  this.dictateSocket();
}
util.inherits(Session,NetTransporter);
Session.prototype.dictateSocket = function () {
  var self = this;
  this.socket.on("close", function () {
    removeSession(self);
  });
}

Session.prototype.handler_status=function(){
  var res={
    status:"",
    message:"",
    workerNum:workerMgr.getWorkerNumber()
  };
  if (this.allowRun()){
    res.status="ready";
    res.message="Agent is ready to run tests.";
  }else{
    res.status="busy";
    res.message="Agent is busy";
  }
  return res;
}
Session.prototype.handler_run=function(benmanCfg){
  var self=this;
  if (this.allowRun()){
    var benman=new Benman();
    benman.importConfig(benmanCfg);
    benman.startAllUnits();
    benman.on("done",function(){
      self.sendCmd("finish",benman.getUnitResults());
    });
    return;
  } else{
    return {error:"Agent is busy on other tests. Please wait for its availability."};
  }
}
Session.prototype.allowRun=function(){
  return sessions.indexOf(this) === 0;
}




function removeSession(session) {
  var idx = sessions.indexOf(session);
  if (idx > -1) {
    sessions.splice(idx, 1);
  }
}

