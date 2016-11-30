process.on("message", function (msg) {
  if (msg.cmd === "request") {
    _request(msg.options,msg.id);
  }
});


process.on("disconnect", function () {
  process.exit(0);
})


var request = require("./request");
var _ = require("lodash");
var Collection = require("postman-collection").Collection;
var cachedOptions={};
function _request(newmanOption,id) {
  if (!cachedOptions[newmanOption.id]){
    cachedOptions[newmanOption.id]=newmanOption;
    newmanOption.collection=new Collection(newmanOption.collection);
  } 
  request(cachedOptions[newmanOption.id], function (err, summary) {
    var result = {
      hasError: false,
      summary: summary,
      totalResponseTime: 0,
    }
    _.each(summary, function (item) {
      if (item.error) {
        result.hasError = true;
      } else {
        result.totalResponseTime += _.get(item, "summary.responseTime", 0);
      }
    });
    process.send({
      id:id,
      cmd:"request_res",
      result:result,
      workerId:process.pid
    });
  });
}