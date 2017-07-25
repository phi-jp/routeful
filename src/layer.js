
var pathToRegexp = require('path-to-regexp');

var Layer = function(path, callbacks) {
  if (!(this instanceof Layer)) {
    return new Layer(path, callbacks);
  }

  this.path = path;
  this.keys = [];
  this.regexp = pathToRegexp(this.path, this.keys);
  this.callbacks = callbacks;
};

Layer.prototype.match = function(url) {
  var match = this.regexp.exec(url.pathname);

  if (!match) return false;

  var params = {};

  for (var i=1; i<match.length; ++i) {
    var val = match[i];
    var key = this.keys[i-1].name;
    params[key] = val;
  }

  return params;
};

Layer.prototype.run = function(req) {
  var index = 0;
  var callbacks = this.callbacks;

  var next = function() {
    if (index >= callbacks.length) {
      return ;
    }

    var callback = callbacks[index++];

    if (callback.length >= 3) {
      callback(req, {}, next);
    }
    else {
      callback(req, {});
      next();
    }
  };

  next();
  // return this.regexp.exec(path);
};

module.exports = Layer;
