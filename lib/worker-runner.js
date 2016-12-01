require("http").globalAgent.maxSockets = Number.POSITIVE_INFINITY
process.on("message", function (msg) {
  if (msg.cmd === "request") {
    _request(msg.options, msg.id);
  }
});


process.on("disconnect", function () {
  process.exit(0);
})


var request = require("./request");
var _ = require("lodash");
var Collection = require("postman-collection").Collection;
var cachedOptions = {};
function _request(newmanOption, id) {
  if (!cachedOptions[newmanOption.id]) {
    cachedOptions[newmanOption.id] = processOptions(newmanOption);
    // cachedOptions[newmanOption.id]=newmanOption;
    // newmanOption.collection=new Collection(newmanOption.collection);
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
        result.totalResponseTime += _.get(item, "responseTime", 0);
      }
    });
    process.send({
      id: id,
      cmd: "request_res",
      result: result,
      workerId: process.pid
    });
  });
}

console.log("worker: ", process.pid);

function processOptions(newmanOption) {

  var rtn = {
    requestOptions: {
      followRedirect: !_.get(newmanOption, "ignoreRedirects", false),
      strictSSL: !_.get(newmanOption, "insecure", true),
    },
    items: _.map(newmanOption.collection.item, mapItem),
    delayRequest:newmanOption.delayRequest
  };
  return rtn;
}

function mapItem(item) {

  var rtn = {
    name: item.name,
    request: mapRequest(item.request)
  }
  return rtn;
}
function mapRequest(req) {
  var rtn = {
    url: req.url,
    method: req.method,
    headers: _.reduce(req.header, function (res, item) { res[item.key] = item.value; return res; }, {}),
  }
  var body=getRequestBody(req);
  rtn=_.merge(rtn,body);
  return rtn;
}
function getRequestBody(request) {
  var options,
    mode = _.get(request, 'body.mode'),
    body = _.get(request, 'body'),
    empty = request.body && request.body.isEmpty && request.body.isEmpty(),
    content;

  if (empty || !mode || !body[mode]) {
    return ;
  }

  content = body[mode];

  if (_.isFunction(content.all)) {
    content = content.all();
  }

  if (mode === 'raw') {
    options = { body: content };
  }
  else if (mode === 'urlencoded') {
    options = {
      form: _.reduce(content, function (accumulator, param) {
        if (param.disabled) { return accumulator; }

        // This is actually pretty simple,
        // If the variable already exists in the accumulator, we need to make the value an Array with
        // all the variable values inside it.
        if (accumulator[param.key]) {
          _.isArray(accumulator[param.key]) ? accumulator[param.key].push(param.value) :
            (accumulator[param.key] = [accumulator[param.key], param.value]);
        }
        else {
          accumulator[param.key] = param.value;
        }
        return accumulator;
      }, {})
    };
  }
  else if (request.body.mode === 'formdata') {
    options = {
      formData: _.reduce(content, function (accumulator, param) {
        if (param.disabled) { return accumulator; }

        // This is actually pretty simple,
        // If the variable already exists in the accumulator, we need to make the value an Array with
        // all the variable values inside it.
        if (accumulator[param.key]) {
          _.isArray(accumulator[param.key]) ? accumulator[param.key].push(param.value) :
            (accumulator[param.key] = [accumulator[param.key], param.value]);
        }
        else {
          accumulator[param.key] = param.value;
        }
        return accumulator;
      }, {})
    };
  }
  else if (request.body.mode === 'file') {
    options = {
      body: _.get(request, 'body.file.content')
    };
  }
  return options;
}