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
  this._root = '';
  this._stack = [];
};

Routeful.prototype.base = function(base) {
  this._base = base;
  return this;
};

Routeful.prototype.root = function(root) {
  this._root = root;
};

Routeful.prototype.on = function(path) {
  var callbacks = slice.call(arguments, 1);
  var layer = Layer(path, callbacks);
  this._stack.push(layer);
};

Routeful.prototype.start = function(exec) {
  this.onpopstate = onpopstate.bind(this);
  this.onclick = onclick.bind(this);

  window.addEventListener('popstate', this.onpopstate);
  window.addEventListener('hashchange', this.onpopstate);
  document.addEventListener(TOUCH_EVENT, this.onclick);

  if (exec) {
    this.emit(location.pathname + location.hash);
  }

  return this;
};

Routeful.prototype.stop = function() {
  // TODO:
};

Routeful.prototype.go = function(path, replace) {
  path = path.replace('/', this._base);

  if (replace === true) {
    history.replaceState(this.state, null, path);
  }
  else {
    history.pushState(this.state, null, path);
  }
  // query は無視する
  this.emit(path);

  return this;
};

Routeful.prototype.emit = function(path) {
  path = path.replace(this._root, '').replace(this._base, '/');

  // check some url
  if (this._current === path) return ;
  this._current = path;

  // マッチングの際は query を外す
  path = path.split('?')[0];

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
  if (!elm || elm.nodeName !== 'A') {
    return;
  }

  // check cross origin
  if (elm.hostname !== location.hostname) {
    return ;
  }

  if (elm.getAttribute('href') && elm.href !== location.href) {
    // var link = elm.getAttribute('href');
    var link = elm.pathname + elm.search + elm.hash;
    this.go(link);
  }

  e.preventDefault();
};

var onpopstate = function(e) {
  this.emit(location.pathname + location.hash);
};

module.exports = Routeful;
