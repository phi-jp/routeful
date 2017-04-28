/*
 *
 */

var TOUCH_EVENT = ('undefined' !== typeof document) && document.ontouchstart ? 'touchstart' : 'click';
var Layer = require('./layer');
var slice = Array.prototype.slice;

var Routeful = function() {
  if (!(this instanceof Routeful)) {
    return new Routeful();
  }

  this._current = location.href;
  this._base = '/';
  this._origin = '';
  this._stack = [];
};

Routeful.prototype.base = function(base) {
  this._base = base;
  return this;
};

Routeful.prototype.origin = function(origin) {
  this._origin = origin;
};

Routeful.prototype.on = function(path) {
  var callbacks = slice.call(arguments, 1);
  var layer = Layer(path, callbacks);
  this._stack.push(layer);
};

Routeful.prototype.start = function(exec) {
  this.onpopstate = onpopstate.bind(this);
  this.onclick = onclick.bind(this);

  window.addEventListener('popstate', this.onpopstate, false);
  document.addEventListener(TOUCH_EVENT, this.onclick);

  if (exec) {
    this.emit(location.pathname + location.hash);
  }

  return this;
};

Routeful.prototype.stop = function() {
  // TODO:
};

Routeful.prototype.go = function(path) {
  history.pushState(this.state, null, path);
  this.emit(path);

  return this;
};

Routeful.prototype.emit = function(path) {
  path = path.replace(this._origin, '').replace(this._base, '/');
  this._stack.some(function(l) {
    var match = l.match(path);

    if (l.match(path)) {
      l.run();
      return true;
    }
  });
  return this;
};

var onclick = function(e) {
  // 
  if (e.metaKey || e.ctrlKey || e.shiftKey) return;

  var elm = e.target;
  while(elm) {
    if (elm.nodeName === 'A') break;
    elm = elm.parentNode;
  }

  // check anchor
  if (!elm || elm.nodeName !== 'A') return;

  // check cross origin
  if (elm.hostname !== location.hostname) {
    return ;
  }

  // check some url
  if (elm.href === location.href) return ;

  var link = elm.getAttribute('href');
  this.go(link);

  e.preventDefault();
};

var onpopstate = function(e) {
  // check some url
  if (this._current !== location.href) {
    this.emit(location.pathname + location.hash);
    this._current = location.href;
  }
};

module.exports = Routeful;
