module.exports = request;
var prequest = require('postman-request')
var Requester = require("postman-runtime").Requester;
var fs = require("fs");
var _ = require("lodash");
var Promise = require("bluebird");
var test = ["aaa", "bbb"];
function request(options, cb) {
  if (options.requester) {
    options.requester.cookieJar = prequest.jar();
  } else {

    var r_options = {
      fileResolver: fs,
      cookieJar: prequest.jar(),
      followRedirects: _.has(options, 'ignoreRedirects') ? !options.ignoreRedirects : undefined,
      strictSSL: _.has(options, 'insecure') ? !options.insecure : undefined,
      certificateManager: options.sslClientCert ? {
        getCertificateContents: function (hostname, callback) {
          return callback(null, {
            key: options.sslClientKey ? fs.readFileSync(options.sslClientKey) : '',
            pem: fs.readFileSync(options.sslClientCert),
            passphrase: options.sslClientPassphrase,
            keyPath: options.sslClientKey,
            pemPath: options.sslClientCert
          });
        }
      } : undefined
    };
    options.requester = new Requester(r_options);
  }
  var items = Array.prototype.slice.call(options.collection.items.all(), 0);
  // var items=test;
  var results = []
  Promise.each(items, function (item) {
    return new Promise(function (res, rej) {
      options.requester.request(item, function (err, data) {
        var result = {
          error: err,
          summary: data
        };
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
