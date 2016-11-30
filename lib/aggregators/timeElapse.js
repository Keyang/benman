var Aggregator = require("./Aggregator");
var util = require("util");
/**
 * Time elapse aggregator will report following:
 * minTime  -- minimum time elapse for running the collection
 * maxTime -- maximum time elapse for running the collection
 * avgTime -- average time elpase for running the collection
 * timeArr -- array of all time elapsed
 * numberOfFailures -- count of request failures
 * numberOfRequests -- number of total requests made
 */
function TimeElapse() {
  Aggregator.call(this);
}
util.inherits(TimeElapse, Aggregator);

TimeElapse.prototype.mapEach = function (item) {
  var _ = this._;
  return {
    responseTime: _.get(item, "totalResponseTime"),
    numberOfFailures: _.filter(item.summary, function (sum) {
       return !!sum.error;
       }).length,
    numberOfRequests: item.summary.length
  }
}

TimeElapse.prototype.reduceEach = function (item, lastResult) {
  if (!lastResult) {
    lastResult = {
      minTime: Number.POSITIVE_INFINITY,
      maxTime: Number.NEGATIVE_INFINITY,
      avgTime: 0,
      timeArr: [],
      numberOfFailures: 0,
      numberOfRequests: 0
    };
  }
  return {
    minTime: Math.min(lastResult.minTime, item.responseTime),
    maxTime: Math.max(lastResult.maxTime, item.responseTime),
    timeArr: lastResult.timeArr.push(item.responseTime) && lastResult.timeArr,
    avgTime: lastResult.timeArr.reduce(function (a, b) { return a + b }, 0) / lastResult.timeArr.length,
    numberOfFailures: lastResult.numberOfFailures += item.numberOfFailures,
    numberOfRequests: lastResult.numberOfRequests += item.numberOfRequests
  };

}

module.exports = new TimeElapse();