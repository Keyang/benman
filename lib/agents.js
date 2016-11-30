module.exports={
  localAgent:localAgent,
  remoteAgent:remoteAgent
}


var LocalWorker=require("./worker/LocalWorker");
var Promise=require("bluebird");

function localAgent(cfg){
  var workers=[];
  for (var i=0;i<cfg.number;i++){
    workers.push(new LocalWorker());    
  } 
  return Promise.resolve({
    cfg:cfg,
    workers:workers
  });
}


var net=require("net");
function remoteAgent(cfg){
  return new Promise(function(res,rej){
    if (!cfg.url){
      rej(new Error("Missed parameter: remote agent's paht"));
    }else{
      var client=net.connect(cfg.url);
      client.once("data",function(data){
        var d=JSON.parse(data);
        if (d.cmd === "welcome"){
          var workerNum=d.workerNum;
        }
      })
    }
  });
}