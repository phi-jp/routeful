
var pathToRegexp = require('path-to-regexp');

var Layer = function(filter, callbacks) {
  if (!(this instanceof Layer)) {
    return new Layer(filter, callbacks);
  }

  this.filter = filter;
  this.keys = [];
  this.regexp = pathToRegexp(this.filter, this.keys);
  this.callbacks = callbacks;
};

Layer.prototype.match = function(path) {
  var match = this.regexp.exec(path);

  if (!match) return false;

  this.params = {};

  for (var i=1; i<match.length; ++i) {
    var val = match[i];
    var key = this.keys[i-1].name;
    this.params[key] = val;
  }

  return true;
};

Layer.prototype.run = function() {
  var index = 0;
  var callbacks = this.callbacks;
  var req = {
    params: this.params,
  };

  var next = function() {
    if (index >= callbacks.length) {
      return ;
    }

    var callback = callbacks[index++];

    callback(req, {}, next);
  };

  next();
  // return this.regexp.exec(path);
};

module.exports = Layer;
