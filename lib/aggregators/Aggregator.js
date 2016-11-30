module.exports=Aggregator;


var _=require("lodash");

function Aggregator(){

}

Aggregator.prototype.map=function(arr){
  var rtn=[];
  var self=this;
  this._=_;
  arr.forEach(function(item){
    rtn.push(self.mapEach(item));
  })
  return rtn;
}

Aggregator.prototype.reduce=function(arr){
  var rtn=undefined;
  var self=this;
  arr.forEach(function(item){
    rtn=self.reduceEach(item,rtn);
  });
  return rtn;
}

/**
 * @param item the summary item produced from newman
 */
Aggregator.prototype.mapEach=function(item){
  throw("not implemented");
}

/**
 * @param item the mapped item returned from mapEach
 * @param lastResult the last result from reduceEach . for first item, lastResult is undefined 
 */
Aggregator.prototype.reduceEach=function(item,lastResult){
  throw("not implemented");
}