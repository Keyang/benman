module.exports={
  parseBenmanResult:parseBenmanResult,
  aggregateUnitResult:aggregateUnitResult
};

var Unit=require("./Unit");
var _=require("lodash");
function parseBenmanResult(results){
  return _.map(results,function(result){
    return {
      unit:result.unit,
      results:result.results,
      aggregatedResult:aggregateUnitResult(result)
    }
  });
}
/**
 * Aggregate results using unit's aggregator
 * result:
 * {
 *  unit: obj //unit configuration
 *  results:[] //results
 * }
 * 
 * @return obj // aggregated result by its configured aggregator
 */
function aggregateUnitResult(result){
  var u=new Unit(result.unit);
  u.results=result.results;
  return u.aggregateResult();
}