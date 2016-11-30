module.exports = NetTransporter;


var EventEmitter = require("events");
var util = require("util");
var Promise = require("bluebird");
var uuid = require("uuid");
var net = require("net");
/**
 * NetTransporter is simple wrapper on top of tcp connection which used by Agent
 */
function NetTransporter() {
  EventEmitter.call(this);
  this.listeners = {};
  this.host = "";
  this.socket = null;
  this._buffer = "";
  this._end = "|#!%^";
}
util.inherits(NetTransporter, EventEmitter);

NetTransporter.prototype.attachSocket = function (socket) {
  var self = this;
  self.socket = socket;
  self.socket.on("data", self.onData.bind(self));
  self.socket.on("close", function () {
    self.clear();
  });
}
NetTransporter.prototype.connect = function () {
  var self = this;
  if (this.socket === null) {
    return new Promise(function (res, rej) {
      var host = self.getHost().split(":");
      self.attachSocket(net.connect({ host: host[0], port: host[1] || 9901 }));
      self.socket.once("connect", function () {
        self.socket.removeAllListeners("error");
        res();
      });
      self.socket.once("error", function (err) {
        self.clear();
        rej(err);
      });
    });
  } else {
    return Promise.reject(new Error("NetTransporter connection has been made."));
  }
}
NetTransporter.prototype.clear = function () {
  this.socket = null;
}
NetTransporter.prototype.disconnect = function () {
  if (this.socket) {
    this.socket.end();
    this.clear();
  }
};
NetTransporter.prototype._write = function (dataStr) {
  if (this.socket){
    this.socket.write(dataStr);
    this.socket.write(this._end);
  }
};
NetTransporter.prototype.getHost = function () {
  return this.host;
}

NetTransporter.prototype.sendCmd = function (cmd, data) {
  if (!this.socket) {
    return Promise.reject(new Error("NetTransporter is not connected."));
  }
  var self = this;
  return new Promise(function (res, rej) {
    var id = uuid();
    var obj = {
      id: id,
      cmd: cmd,
      data: data
    };
    self.listeners[id] = function (d) {
      if (d) {
        if (d.error) {
          rej(new Error(d.error));
        } else {
          res(d.data || d);
        }
      } else {
        res(d);
      }
    };
    self._write(JSON.stringify(obj));
  });
}

NetTransporter.prototype.onData = function (data) {
  var dataStr = this._buffer + data.toString();
  this._buffer = "";
  if (dataStr.indexOf(this._end) > -1) {
    var partial = dataStr.split(this._end);
    for (var i = 0; i < partial.length - 1; i++) {
      this.parseData(partial[i]);
    }
    this._buffer = partial[partial.length - 1];
  } else {
    this._buffer = dataStr;
  }

}
NetTransporter.prototype.parseData = function (data) {
  data = JSON.parse(data);
  if (data.cmd === "response") {
    var id = data.id;
    var obj = data.data;
    if (this.listeners[id]) {
      this.listeners[id](obj);
      delete this.listeners[id];
    }
  } else {
    var cmd = "handler_" + data.cmd;
    if (this[cmd] && typeof this[cmd] === "function") {
      this.reply(this[cmd](data.data, data.id), data.id,data.cmd);
    }
  }
}
NetTransporter.prototype.reply = function (res, id,cmd) {
  var self = this;
  if (res && res.then) {
    res.then(function (d) {
      self.reply(d, id);
    });
  } else {
    this._write(JSON.stringify({
      id: id,
      cmd: "response",
      data: res
    }));
  }
}