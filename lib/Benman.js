module.exports=Benman;
var EventEmitter=require("events");
var util=require("util");
var Unit=require("./Unit");
var _=require("lodash");
/**
 * Events:
 *  done  -- all units have finished
 */
function Benman(){
  EventEmitter.call(this);
  this.results=[];
  this.units=[];
  this.name="My Test Suit";
}
util.inherits(Benman,EventEmitter);


Benman.prototype.importConfig=function(cfg){
  var self=this;
  cfg.units.forEach(function(unitParam){
    var u=new Unit(unitParam);
    self.registerUnit(u);
  }); 
  this.name=cfg.name;
}
Benman.prototype.registerUnit=function(unit){
  var self=this;
  unit.on("done",function(){
    var isAllFinished=true;
    self.units.forEach(function(un){
        if (!un.started || !un.stopped){
          isAllFinished=false;
        }
    }); 
    if (isAllFinished){
      self.emit("done",self);
    }
  });
  this.units.push(unit); 
}
Benman.prototype.startAllUnits=function(){
  var self=this;
  this.units.forEach(function(unit){
    if (unit.started === false){
      unit.start();
    }
  });
}
Benman.prototype.stopAllUnits=function(){
  this.units.forEach(function(unit){
    unit.stop();
  });
}
Benman.prototype.exportConfig=function(){
  var rtn={
    name:this.name,
    units:[]
  };
  var self=this;
  this.units.forEach(function(u){
    rtn.units.push(u.getParams());
  });
  return rtn;
}
Benman.prototype.addUnit=function(unit){
  this.registerUnit(unit);
}
Benman.prototype.removeUnit=function(idx){
  var u=this.units[idx];
  if (u && !u.isRunning()){
    this.units.splice(idx,1);
    u.removeAllListeners();
  }
}
Benman.prototype.getActiveUnits=function(){
  return _.filter(this.units,function(unit){
    return unit.isRunning();
  });
}
Benman.prototype.getUnitResults=function(){
  return _.map(this.units,function(unit){
    return {
      unit:_.cloneDeep(unit.params),
      results:unit.getResults(),
      aggregatedResults:unit.aggregateResult()
    }
  });
}

Benman.prototype.getUnits=function(){
  return this.units; 
}