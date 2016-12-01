module.exports = _request;
var _ = require("lodash");
var Promise = require("bluebird");
var request=require("request");
function _request(options, cb) {
  var params=_.merge({
    jar:request.jar()
  },options.requestOptions);
  var r=request.defaults(params);
  var results = []
  Promise.each(options.items, function (item) {
    return new Promise(function (res, rej) {
      var start=new Date().getTime();
      r(item.request, function (err, response,body) {
        var end=new Date().getTime();
        var result = {
          error: err,
          summary:null,
          start:start,
          end:end,
          responseTime:end-start
        };
        if (res){
          //expose some fields from IncomingMessage instance
          result.summary={
            responseCode:res.statusCode,
            responseBodySize:body?body.length:0,
            responseHeaders:res.headers 
          }
        }
        results.push(result);
        res(result);
      })
    })
      .delay(options.delayRequest || 0);
  })
    .then(function () {
      cb(null, results);
    });
}
