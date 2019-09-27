/*
 *
 */

var URL = require('url');
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
  // 履歴の数だけ、空の配列を生成する
  this._history = new Array(history.length);
  // 現在のページに history.state が設定されていて、想定のフォーマットならそのまま history.state をセットする
  // history.state が想定外のフォーマットの場合は、 history.length - 1 を設定する
  // state は this._history のインデックス
  this.state = this.testStateFormat(history.state) ? history.state : history.length - 1;
  // 現在のページのURLをキャッシュしておく
  this._history[this.state] = location.href.replace(location.origin, '');
  // 現在のページに state (index) を設定しておく
  history.replaceState(this.state, null, this._history[this.state]);
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
    this.exec();
  }

  return this;
};

// 今のページで emit
Routeful.prototype.exec = function() {
  this.emit(location.pathname + location.search + location.hash);
  return this;
};

Routeful.prototype.stop = function() {
  // TODO:
};

Routeful.prototype.go = function(path, replace) {
  path = path.replace('/', this._base);

  if (replace === true) {
    history.replaceState(this.state, null, path);
    // 今のURLを再キャッシュする
    this._history[this.state] = location.href.replace(location.origin, '');
  }
  else {
    history.pushState(this.state + 1, null, path);
    this._pushHistory();
  }
  // 戻ったか進んだかのフラグを false にする
  this.isBack = false;
  this.isForward = false;
  // query は無視する
  this.emit(path);

  return this;
};

Routeful.prototype.emit = function(path) {
  path = path.replace(this._root, '').replace(this._base, '/');

  // check some url
  if (this._current === path) return this;
  this._current = path;

  var url = URL.parse(path, true);

  this._stack.some(function(l) {
    var params = l.match(url);

    if (params) {
      l.run({
        url: url.path,
        query: url.query,
        Url: url,
        params: params,
        layer: l,
      });
      return true;
    }
  });
  return this;
};

/**
 * 履歴のインデックスを進めて、URLをキャッシュする
 */
Routeful.prototype._pushHistory = function() {
  this.state++;
  if (this.state < this._history.length) {
    this._history = this._history.slice(0, this.state);
  }
  this._history[this.state] = location.href.replace(location.origin, '');
  return this;
};

/**
 * routeful で想定する、 state のフォーマットかどうか
 * @param {*} state 
 */
Routeful.prototype.testStateFormat = function(state) {
  return typeof state === 'number';
};

Routeful.prototype.popState = function(state) {
  this.isLegacy = !this.testStateFormat(state);
  // 想定外のフォーマットの場合は、旧仕様のフラグを立てて、必要最低限の処理のみ実行する
  if (this.isLegacy) {
    return this;
  }
  // 戻ったフラグ
  this.isBack = this.state > state;
  // 進んだフラグ
  this.isForward = this.state < state;
  // state (index) の更新
  this.state = state;
  // URL をキャッシュ
  this._history[this.state] = location.href.replace(location.origin, '');
  return this;
};

/**
 * 現在のページのパスを取得
 */
Routeful.prototype.getCurrent = function() {
  return this._current;
};

/**
 * 前のページのパスを取得
 * 取得できない場合は null
 */
Routeful.prototype.getPrev = function() {
  if (this.isLegacy) {
    return null;
  }
  var url = this._history[this.state - 1];
  if (!url) {
    return null;
  }
  return url.replace(this._root, '').replace(this._base, '/');
};

/**
 * 次のページのパスを取得
 * 取得できない場合は null
 */
Routeful.prototype.getNext = function() {
  if (this.isLegacy) {
    return null;
  }
  var url = this._history[this.state + 1];
  if (!url) {
    return null;
  }
  return url.replace(this._root, '').replace(this._base, '/');
};

/**
 * 戻れるかどうか
 */
Routeful.prototype.canBack = function() {
  if (this.isLegacy) {
    return false;
  }
  return this.state > 0;
};

/**
 * 進めるかどうか
 */
Routeful.prototype.canForward = function() {
  if (this.isLegacy) {
    return false;
  }
  return this.state < this._history.length - 1;
};

var onclick = function(e) {
  // 
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.defaultPrevented) return;

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
  // バックをキャンセル
  if (e.preventBack) {
    // URL を元に戻す
    history.forward();
    return ;
  }
  
  if (e.type === 'popstate') {
    this.popState(e.state);
  }
  else if (e.type === 'hashchange') {
    // location.hash = 'xxx' で変更した場合は、 go で pushState した後と同じ状態になるように処理する
    if (!this.isLegacy && !this.testStateFormat(history.state)) {
      this._pushHistory();
      this.isBack = false;
      this.isForward = false;
    }
  }
  this.exec();
};

module.exports = Routeful;
