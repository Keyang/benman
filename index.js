/**
Benman Configuration:
var testSuit = {
  "name": "My Load test suit",
  "units": [
    {
      "name": "general app usage",
      "numberOfUser": 10,
      "rampUpPeriod": 0,
      "loopCount": 10, //-1 means infinite
      "aggregator": "timeElapse",
      "newmanOption": {
        collection: require("./1.json")
      }
    }
  ]
}
Usage example:
var Agent=require("./lib/agent/Agent");
Agent.createLocalAgent({
  name:"My local agent"
})
.then(function(agent){
  agent.on("finish",function(agent,result){
    console.log(result);
  })
  return agent.connect()
  .then(function(){
    return agent.getStatus();
  })
  .then(function(status){
    if (status.status==="ready"){
      return agent.run(testSuit);
    }else{
      throw(status);
    }
  })
})

 */


module.exports=require("./lib");