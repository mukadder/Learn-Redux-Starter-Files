(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function(selectors, getState, ...args) {
	return Object.keys(selectors).reduce((p, selectorKey) => {
		Object.defineProperty(p, selectorKey, {
			get: function() { return selectors[selectorKey](getState(), ...args) },
			enumerable: true
		});
		return p;
	}, {});
};

},{}],2:[function(require,module,exports){
(function (process){
if (typeof Map !== 'function' || (process && process.env && process.env.TEST_MAPORSIMILAR === 'true')) {
	module.exports = require('./similar');
}
else {
	module.exports = Map;
}
}).call(this,require('_process'))

},{"./similar":3,"_process":5}],3:[function(require,module,exports){
function Similar() {
	this.list = [];
	this.lastItem = undefined;
	this.size = 0;

	return this;
}

Similar.prototype.get = function(key) {
	var index;

	if (this.lastItem && this.isEqual(this.lastItem.key, key)) {
		return this.lastItem.val;
	}

	index = this.indexOf(key);
	if (index >= 0) {
		this.lastItem = this.list[index];
		return this.list[index].val;
	}

	return undefined;
};

Similar.prototype.set = function(key, val) {
	var index;

	if (this.lastItem && this.isEqual(this.lastItem.key, key)) {
		this.lastItem.val = val;
		return this;
	}

	index = this.indexOf(key);
	if (index >= 0) {
		this.lastItem = this.list[index];
		this.list[index].val = val;
		return this;
	}

	this.lastItem = { key: key, val: val };
	this.list.push(this.lastItem);
	this.size++;

	return this;
};

Similar.prototype.delete = function(key) {
	var index;

	if (this.lastItem && this.isEqual(this.lastItem.key, key)) {
		this.lastItem = undefined;
	}

	index = this.indexOf(key);
	if (index >= 0) {
		this.size--;
		return this.list.splice(index, 1)[0];
	}

	return undefined;
};


// important that has() doesn't use get() in case an existing key has a falsy value, in which case has() would return false
Similar.prototype.has = function(key) {
	var index;

	if (this.lastItem && this.isEqual(this.lastItem.key, key)) {
		return true;
	}

	index = this.indexOf(key);
	if (index >= 0) {
		this.lastItem = this.list[index];
		return true;
	}

	return false;
};

Similar.prototype.forEach = function(callback, thisArg) {
	var i;
	for (i = 0; i < this.size; i++) {
		callback.call(thisArg || this, this.list[i].val, this.list[i].key, this);
	}
};

Similar.prototype.indexOf = function(key) {
	var i;
	for (i = 0; i < this.size; i++) {
		if (this.isEqual(this.list[i].key, key)) {
			return i;
		}
	}
	return -1;
};

// check if the numbers are equal, or whether they are both precisely NaN (isNaN returns true for all non-numbers)
Similar.prototype.isEqual = function(val1, val2) {
	return val1 === val2 || (val1 !== val1 && val2 !== val2);
};

module.exports = Similar;
},{}],4:[function(require,module,exports){
var MapOrSimilar = require('map-or-similar');

module.exports = function (limit) {
	var cache = new MapOrSimilar(),
		lru = [];

	return function (fn) {
		var memoizerific = function () {
			var currentCache = cache,
				newMap,
				fnResult,
				argsLengthMinusOne = arguments.length - 1,
				lruPath = Array(argsLengthMinusOne + 1),
				isMemoized = true,
				i;

			if ((memoizerific.numArgs || memoizerific.numArgs === 0) && memoizerific.numArgs !== argsLengthMinusOne + 1) {
				throw new Error('Memoizerific functions should always be called with the same number of arguments');
			}

			// loop through each argument to traverse the map tree
			for (i = 0; i < argsLengthMinusOne; i++) {
				lruPath[i] = {
					cacheItem: currentCache,
					arg: arguments[i]
				};

				// climb through the hierarchical map tree until the second-last argument has been found, or an argument is missing.
				// if all arguments up to the second-last have been found, this will potentially be a cache hit (determined below)
				if (currentCache.has(arguments[i])) {
					currentCache = currentCache.get(arguments[i]);
					continue;
				}

				isMemoized = false;

				// make maps until last value
				newMap = new MapOrSimilar();
				currentCache.set(arguments[i], newMap);
				currentCache = newMap;
			}

			// we are at the last arg, check if it is really memoized
			if (isMemoized) {
				if (currentCache.has(arguments[argsLengthMinusOne])) {
					fnResult = currentCache.get(arguments[argsLengthMinusOne]);
				}
				else {
					isMemoized = false;
				}
			}

			if (!isMemoized) {
				fnResult = fn.apply(null, arguments);
				currentCache.set(arguments[argsLengthMinusOne], fnResult);
			}

			if (limit > 0) {
				lruPath[argsLengthMinusOne] = {
					cacheItem: currentCache,
					arg: arguments[argsLengthMinusOne]
				};

				if (isMemoized) {
					moveToMostRecentLru(lru, lruPath);
				}
				else {
					lru.push(lruPath);
				}

				if (lru.length > limit) {
					removeCachedResult(lru.shift());
				}
			}

			memoizerific.wasMemoized = isMemoized;
			memoizerific.numArgs = argsLengthMinusOne + 1;

			return fnResult;
		};

		memoizerific.limit = limit;
		memoizerific.wasMemoized = false;
		memoizerific.cache = cache;
		memoizerific.lru = lru;

		return memoizerific;
	};
};

// move current args to most recent position
function moveToMostRecentLru(lru, lruPath) {
	var lruLen = lru.length,
		lruPathLen = lruPath.length,
		isMatch,
		i, ii;

	for (i = 0; i < lruLen; i++) {
		isMatch = true;
		for (ii = 0; ii < lruPathLen; ii++) {
			if (!isEqual(lru[i][ii].arg, lruPath[ii].arg)) {
				isMatch = false;
				break;
			}
		}
		if (isMatch) {
			break;
		}
	}

	lru.push(lru.splice(i, 1)[0]);
}

// remove least recently used cache item and all dead branches
function removeCachedResult(removedLru) {
	var removedLruLen = removedLru.length,
		currentLru = removedLru[removedLruLen - 1],
		tmp,
		i;

	currentLru.cacheItem.delete(currentLru.arg);

	// walk down the tree removing dead branches (size 0) along the way
	for (i = removedLruLen - 2; i >= 0; i--) {
		currentLru = removedLru[i];
		tmp = currentLru.cacheItem.get(currentLru.arg);

		if (!tmp || !tmp.size) {
			currentLru.cacheItem.delete(currentLru.arg);
		} else {
			break;
		}
	}
}

// check if the numbers are equal, or whether they are both precisely NaN (isNaN returns true for all non-numbers)
function isEqual(val1, val2) {
	return val1 === val2 || (val1 !== val1 && val2 !== val2);
}
},{"map-or-similar":2}],5:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],6:[function(require,module,exports){
(function (global){
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var t;t="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,t.todoReactComponents=e()}}(function(){var e;return function e(t,a,n){function o(s,r){if(!a[s]){if(!t[s]){var u="function"==typeof require&&require;if(!r&&u)return u(s,!0);if(l)return l(s,!0);var c=new Error("Cannot find module '"+s+"'");throw c.code="MODULE_NOT_FOUND",c}var d=a[s]={exports:{}};t[s][0].call(d.exports,function(e){var a=t[s][1][e];return o(a?a:e)},d,d.exports,e,t,a,n)}return a[s].exports}for(var l="function"==typeof require&&require,s=0;s<n.length;s++)o(n[s]);return o}({1:[function(t,a){!function(){"use strict";function t(){for(var e=[],a=0;a<arguments.length;a++){var o=arguments[a];if(o){var l=typeof o;if("string"===l||"number"===l)e.push(o);else if(Array.isArray(o))e.push(t.apply(null,o));else if("object"===l)for(var s in o)n.call(o,s)&&o[s]&&e.push(s)}}return e.join(" ")}var n={}.hasOwnProperty;"undefined"!=typeof a&&a.exports?a.exports=t:"function"==typeof e&&"object"==typeof e.amd&&e.amd?e("classnames",[],function(){return t}):window.classNames=t}()},{}],2:[function(e,t){t.exports=React.createClass({propTypes:{className:React.PropTypes.string,href:React.PropTypes.string,target:React.PropTypes.string,onClick:React.PropTypes.func},handleClick:function(e){this.props.target||this.props.href&&0===this.props.href.indexOf("mailto:")||0===!e.button||e.metaKey||e.altKey||e.ctrlKey||e.shiftKey||(e.preventDefault(),this.props.onClick&&this.props.onClick(this.props.href))},render:function(){return React.createElement("a",Object.assign({},this.props,{href:this.props.href,className:"link "+this.props.className,onClick:this.handleClick}))}})},{}],3:[function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(a,"__esModule",{value:!0});var o="undefined"!=typeof window?window.React:"undefined"!=typeof global?global.React:null,l=n(o),s=e("classnames"),r=n(s),u=e("../site/site-header"),c=n(u),d=function(e){return l.default.createElement("div",null,l.default.createElement(c.default,e.siteHeader),l.default.createElement("main",{className:r.default("page",e.className)},l.default.createElement("p",null,"Read the article: ",l.default.createElement("a",{href:"http://www.thinkloop.com/article/extreme-decoupling-react-redux-selectors",target:"_blank"},"Extreme Decoupling React Redux Selectors")),l.default.createElement("p",null,"See the code on github:"),l.default.createElement("ul",null,l.default.createElement("li",null,l.default.createElement("a",{href:"https://github.com/thinkloop/todo-app",target:"_blank"},l.default.createElement("strong",null,"integration"),": selectors")),l.default.createElement("li",null,l.default.createElement("a",{href:"https://github.com/thinkloop/todo-react-components",target:"_blank"},l.default.createElement("strong",null,"view"),": react components")),l.default.createElement("li",null,l.default.createElement("a",{href:"https://github.com/thinkloop/todo-redux-state",target:"_blank"},l.default.createElement("strong",null,"state"),": redux container")))))};d.propTypes={className:l.default.PropTypes.string,siteHeader:l.default.PropTypes.object},a.default=d},{"../site/site-header":6,classnames:1}],4:[function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(a,"__esModule",{value:!0});var o=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var a=arguments[t];for(var n in a)Object.prototype.hasOwnProperty.call(a,n)&&(e[n]=a[n])}return e};a.default=function(e,t){var a=void 0;switch(e.url!==window.location.pathname+window.location.search&&window.history.pushState(null,null,e.url),e.selectedPage){case u.ABOUT:a=s.default.createElement(f.default,{className:"about-page",siteHeader:e.siteHeader});break;default:a=s.default.createElement(d.default,o({className:"todos-page"},e.todos,{siteHeader:e.siteHeader}))}r.render(a,t)};var l="undefined"!=typeof window?window.React:"undefined"!=typeof global?global.React:null,s=n(l),r="undefined"!=typeof window?window.ReactDOM:"undefined"!=typeof global?global.ReactDOM:null,u=e("./site/constants/pages"),c=e("./todos/todos-page"),d=n(c),i=e("./about/about-page"),f=n(i)},{"./about/about-page":3,"./site/constants/pages":5,"./todos/todos-page":12}],5:[function(e,t,a){"use strict";Object.defineProperty(a,"__esModule",{value:!0});a.HOME="HOME",a.ABOUT="ABOUT"},{}],6:[function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(a,"__esModule",{value:!0});var o="undefined"!=typeof window?window.React:"undefined"!=typeof global?global.React:null,l=n(o),s=e("classnames"),r=n(s),u=e("../site/constants/pages"),c=e("link-react"),d=n(c),i=function(e){return l.default.createElement("header",{className:r.default("site-header",e.className)},l.default.createElement("nav",null,l.default.createElement(d.default,{className:r.default({selected:e.selectedPage===u.HOME}),href:e.homeLink.href,onClick:e.homeLink.onClick},e.homeLink.label),l.default.createElement(d.default,{className:r.default({selected:e.selectedPage===u.ABOUT}),href:e.aboutLink.href,onClick:e.aboutLink.onClick},e.aboutLink.label)))};i.propTypes={className:l.default.PropTypes.string,selectedPage:l.default.PropTypes.string,homeLink:l.default.PropTypes.object,aboutLink:l.default.PropTypes.object},a.default=i},{"../site/constants/pages":5,classnames:1,"link-react":2}],7:[function(e,t,a){"use strict";function n(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var a in e)Object.prototype.hasOwnProperty.call(e,a)&&(t[a]=e[a]);return t.default=e,t}function o(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(a,"__esModule",{value:!0}),a.constants=a.render=void 0;var l=e("./render"),s=o(l),r=e("./site/constants/pages"),u=n(r),c=e("./todos/constants/statuses"),d=n(c),i={PAGES:u,TODO_STATUSES:d};a.default={render:s.default,constants:i},a.render=s.default,a.constants=i},{"./render":4,"./site/constants/pages":5,"./todos/constants/statuses":8}],8:[function(e,t,a){"use strict";Object.defineProperty(a,"__esModule",{value:!0});a.PENDING="PENDING",a.COMPLETE="COMPLETE",a.TOTAL="TOTAL"},{}],9:[function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(a,"__esModule",{value:!0});var o="undefined"!=typeof window?window.React:"undefined"!=typeof global?global.React:null,l=n(o),s=e("classnames"),r=n(s),u=function(e){return l.default.createElement("article",{className:r.default("list-item",{checked:e.isComplete},e.className)},l.default.createElement("label",{className:"description"},l.default.createElement("input",{className:"checkbox",type:"checkbox",checked:e.isComplete,onChange:e.onCheckboxToggled}),e.description),l.default.createElement("button",{className:"button",onClick:e.onButtonClicked},e.buttonLabel))};u.propTypes={className:l.default.PropTypes.string,description:l.default.PropTypes.string,isComplete:l.default.PropTypes.bool,buttonLabel:l.default.PropTypes.string,onButtonClicked:l.default.PropTypes.func,onCheckboxToggled:l.default.PropTypes.func},a.default=u},{classnames:1}],10:[function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(a,"__esModule",{value:!0});var o=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var a=arguments[t];for(var n in a)Object.prototype.hasOwnProperty.call(a,n)&&(e[n]=a[n])}return e},l="undefined"!=typeof window?window.React:"undefined"!=typeof global?global.React:null,s=n(l),r=e("classnames"),u=n(r),c=e("../todos/todo-item"),d=n(c),i=function(e){return s.default.createElement("section",{className:u.default("list",e.className)},!!e.todos&&e.todos.map(function(e){return s.default.createElement(d.default,o({key:e.id},e))}))};i.propTypes={className:s.default.PropTypes.string,todos:s.default.PropTypes.array},a.default=i},{"../todos/todo-item":9,classnames:1}],11:[function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function l(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function s(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(a,"__esModule",{value:!0});var r=function(){function e(e,t){for(var a=0;a<t.length;a++){var n=t[a];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,a,n){return a&&e(t.prototype,a),n&&e(t,n),t}}(),u="undefined"!=typeof window?window.React:"undefined"!=typeof global?global.React:null,c=n(u),d=e("classnames"),i=n(d),f=function(e){function t(e){o(this,t);var a=l(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return a.handleOnChange=function(e){a.setState({value:e.target.value})},a.handleOnSubmit=function(e){e.preventDefault(),a.setState({value:""}),a.props.onSubmit(a.state.value)},a.state={value:a.props.value||""},a.handleOnChange=a.handleOnChange.bind(a),a.handleOnSubmit=a.handleOnSubmit.bind(a),a}return s(t,e),r(t,[{key:"render",value:function(){var e=this.props,t=this.state;return c.default.createElement("form",{className:i.default(e.className),onSubmit:this.handleOnSubmit},c.default.createElement("input",{className:"todos-new-form-input",value:t.value,placeholder:e.placeholder,onChange:this.handleOnChange}))}}]),t}(u.Component);f.propTypes={className:c.default.PropTypes.string,placeholder:c.default.PropTypes.string,onSubmit:c.default.PropTypes.func},a.default=f},{classnames:1}],12:[function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(a,"__esModule",{value:!0});var o=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var a=arguments[t];for(var n in a)Object.prototype.hasOwnProperty.call(a,n)&&(e[n]=a[n])}return e},l="undefined"!=typeof window?window.React:"undefined"!=typeof global?global.React:null,s=n(l),r=e("classnames"),u=n(r),c=e("../site/site-header"),d=n(c),i=e("../todos/todos-new-form"),f=n(i),p=e("../todos/todos-list"),m=n(p),y=e("../todos/todos-summary"),h=n(y),b=function(e){return s.default.createElement("div",null,s.default.createElement(d.default,e.siteHeader),s.default.createElement("main",{className:u.default("page",e.className)},!!e.newForm&&s.default.createElement(f.default,o({className:"todos-new-form"},e.newForm)),!!e.list&&s.default.createElement(m.default,{className:"todos-list",todos:e.list}),!!e.summary&&s.default.createElement(h.default,o({className:"todos-summary"},e.summary))))};b.propTypes={className:s.default.PropTypes.string,siteHeader:s.default.PropTypes.object,newForm:s.default.PropTypes.object,list:s.default.PropTypes.array,summary:s.default.PropTypes.object},a.default=b},{"../site/site-header":6,"../todos/todos-list":10,"../todos/todos-new-form":11,"../todos/todos-summary":13,classnames:1}],13:[function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(a,"__esModule",{value:!0});var o="undefined"!=typeof window?window.React:"undefined"!=typeof global?global.React:null,l=n(o),s=e("classnames"),r=n(s),u=e("../todos/constants/statuses"),c=function(e){return l.default.createElement("section",{className:r.default("todo-summary",e.className)},l.default.createElement("span",{className:r.default("todo-summary-pending",{"is-selected":e.selectedSummaryStatus===u.PENDING}),onClick:e.onClickPending},e.countIncomplete),l.default.createElement("span",{className:r.default("todo-summary-complete",{"is-selected":e.selectedSummaryStatus===u.COMPLETE}),onClick:e.onClickComplete},e.countComplete),l.default.createElement("span",{className:r.default("todo-summary-total",{"is-selected":e.selectedSummaryStatus===u.TOTAL}),onClick:e.onClickTotal},e.countTotal))};c.propTypes={className:l.default.PropTypes.string,countIncomplete:l.default.PropTypes.string,countComplete:l.default.PropTypes.string,countTotal:l.default.PropTypes.string,selectedSummaryStatus:l.default.PropTypes.oneOf([u.PENDING,u.COMPLETE,u.TOTAL]),onClickPending:l.default.PropTypes.func,onClickComplete:l.default.PropTypes.func,onClickTotal:l.default.PropTypes.func},a.default=c},{"../todos/constants/statuses":8,classnames:1}]},{},[7])(7)});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],7:[function(require,module,exports){
(function (process,global){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.todoReduxState = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
function createThunkMiddleware(extraArgument) {
  return function (_ref) {
    var dispatch = _ref.dispatch;
    var getState = _ref.getState;
    return function (next) {
      return function (action) {
        if (typeof action === 'function') {
          return action(dispatch, getState, extraArgument);
        }

        return next(action);
      };
    };
  };
}

var thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

exports['default'] = thunk;
},{}],2:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports['default'] = applyMiddleware;

var _compose = _dereq_('./compose');

var _compose2 = _interopRequireDefault(_compose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 */
function applyMiddleware() {
  for (var _len = arguments.length, middlewares = Array(_len), _key = 0; _key < _len; _key++) {
    middlewares[_key] = arguments[_key];
  }

  return function (createStore) {
    return function (reducer, preloadedState, enhancer) {
      var store = createStore(reducer, preloadedState, enhancer);
      var _dispatch = store.dispatch;
      var chain = [];

      var middlewareAPI = {
        getState: store.getState,
        dispatch: function dispatch(action) {
          return _dispatch(action);
        }
      };
      chain = middlewares.map(function (middleware) {
        return middleware(middlewareAPI);
      });
      _dispatch = _compose2['default'].apply(undefined, chain)(store.dispatch);

      return _extends({}, store, {
        dispatch: _dispatch
      });
    };
  };
}
},{"./compose":5}],3:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = bindActionCreators;
function bindActionCreator(actionCreator, dispatch) {
  return function () {
    return dispatch(actionCreator.apply(undefined, arguments));
  };
}

/**
 * Turns an object whose values are action creators, into an object with the
 * same keys, but with every function wrapped into a `dispatch` call so they
 * may be invoked directly. This is just a convenience method, as you can call
 * `store.dispatch(MyActionCreators.doSomething())` yourself just fine.
 *
 * For convenience, you can also pass a single function as the first argument,
 * and get a function in return.
 *
 * @param {Function|Object} actionCreators An object whose values are action
 * creator functions. One handy way to obtain it is to use ES6 `import * as`
 * syntax. You may also pass a single function.
 *
 * @param {Function} dispatch The `dispatch` function available on your Redux
 * store.
 *
 * @returns {Function|Object} The object mimicking the original object, but with
 * every action creator wrapped into the `dispatch` call. If you passed a
 * function as `actionCreators`, the return value will also be a single
 * function.
 */
function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch);
  }

  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error('bindActionCreators expected an object or a function, instead received ' + (actionCreators === null ? 'null' : typeof actionCreators) + '. ' + 'Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?');
  }

  var keys = Object.keys(actionCreators);
  var boundActionCreators = {};
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var actionCreator = actionCreators[key];
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
    }
  }
  return boundActionCreators;
}
},{}],4:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = combineReducers;

var _createStore = _dereq_('./createStore');

var _isPlainObject = _dereq_('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

var _warning = _dereq_('./utils/warning');

var _warning2 = _interopRequireDefault(_warning);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function getUndefinedStateErrorMessage(key, action) {
  var actionType = action && action.type;
  var actionName = actionType && '"' + actionType.toString() + '"' || 'an action';

  return 'Given action ' + actionName + ', reducer "' + key + '" returned undefined. ' + 'To ignore an action, you must explicitly return the previous state.';
}

function getUnexpectedStateShapeWarningMessage(inputState, reducers, action, unexpectedKeyCache) {
  var reducerKeys = Object.keys(reducers);
  var argumentName = action && action.type === _createStore.ActionTypes.INIT ? 'preloadedState argument passed to createStore' : 'previous state received by the reducer';

  if (reducerKeys.length === 0) {
    return 'Store does not have a valid reducer. Make sure the argument passed ' + 'to combineReducers is an object whose values are reducers.';
  }

  if (!(0, _isPlainObject2['default'])(inputState)) {
    return 'The ' + argumentName + ' has unexpected type of "' + {}.toString.call(inputState).match(/\s([a-z|A-Z]+)/)[1] + '". Expected argument to be an object with the following ' + ('keys: "' + reducerKeys.join('", "') + '"');
  }

  var unexpectedKeys = Object.keys(inputState).filter(function (key) {
    return !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key];
  });

  unexpectedKeys.forEach(function (key) {
    unexpectedKeyCache[key] = true;
  });

  if (unexpectedKeys.length > 0) {
    return 'Unexpected ' + (unexpectedKeys.length > 1 ? 'keys' : 'key') + ' ' + ('"' + unexpectedKeys.join('", "') + '" found in ' + argumentName + '. ') + 'Expected to find one of the known reducer keys instead: ' + ('"' + reducerKeys.join('", "') + '". Unexpected keys will be ignored.');
  }
}

function assertReducerSanity(reducers) {
  Object.keys(reducers).forEach(function (key) {
    var reducer = reducers[key];
    var initialState = reducer(undefined, { type: _createStore.ActionTypes.INIT });

    if (typeof initialState === 'undefined') {
      throw new Error('Reducer "' + key + '" returned undefined during initialization. ' + 'If the state passed to the reducer is undefined, you must ' + 'explicitly return the initial state. The initial state may ' + 'not be undefined.');
    }

    var type = '@@redux/PROBE_UNKNOWN_ACTION_' + Math.random().toString(36).substring(7).split('').join('.');
    if (typeof reducer(undefined, { type: type }) === 'undefined') {
      throw new Error('Reducer "' + key + '" returned undefined when probed with a random type. ' + ('Don\'t try to handle ' + _createStore.ActionTypes.INIT + ' or other actions in "redux/*" ') + 'namespace. They are considered private. Instead, you must return the ' + 'current state for any unknown actions, unless it is undefined, ' + 'in which case you must return the initial state, regardless of the ' + 'action type. The initial state may not be undefined.');
    }
  });
}

/**
 * Turns an object whose values are different reducer functions, into a single
 * reducer function. It will call every child reducer, and gather their results
 * into a single state object, whose keys correspond to the keys of the passed
 * reducer functions.
 *
 * @param {Object} reducers An object whose values correspond to different
 * reducer functions that need to be combined into one. One handy way to obtain
 * it is to use ES6 `import * as reducers` syntax. The reducers may never return
 * undefined for any action. Instead, they should return their initial state
 * if the state passed to them was undefined, and the current state for any
 * unrecognized action.
 *
 * @returns {Function} A reducer function that invokes every reducer inside the
 * passed object, and builds a state object with the same shape.
 */
function combineReducers(reducers) {
  var reducerKeys = Object.keys(reducers);
  var finalReducers = {};
  for (var i = 0; i < reducerKeys.length; i++) {
    var key = reducerKeys[i];

    if ("development" !== 'production') {
      if (typeof reducers[key] === 'undefined') {
        (0, _warning2['default'])('No reducer provided for key "' + key + '"');
      }
    }

    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key];
    }
  }
  var finalReducerKeys = Object.keys(finalReducers);

  if ("development" !== 'production') {
    var unexpectedKeyCache = {};
  }

  var sanityError;
  try {
    assertReducerSanity(finalReducers);
  } catch (e) {
    sanityError = e;
  }

  return function combination() {
    var state = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var action = arguments[1];

    if (sanityError) {
      throw sanityError;
    }

    if ("development" !== 'production') {
      var warningMessage = getUnexpectedStateShapeWarningMessage(state, finalReducers, action, unexpectedKeyCache);
      if (warningMessage) {
        (0, _warning2['default'])(warningMessage);
      }
    }

    var hasChanged = false;
    var nextState = {};
    for (var i = 0; i < finalReducerKeys.length; i++) {
      var key = finalReducerKeys[i];
      var reducer = finalReducers[key];
      var previousStateForKey = state[key];
      var nextStateForKey = reducer(previousStateForKey, action);
      if (typeof nextStateForKey === 'undefined') {
        var errorMessage = getUndefinedStateErrorMessage(key, action);
        throw new Error(errorMessage);
      }
      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }
    return hasChanged ? nextState : state;
  };
}
},{"./createStore":6,"./utils/warning":8,"lodash/isPlainObject":12}],5:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = compose;
/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */

function compose() {
  for (var _len = arguments.length, funcs = Array(_len), _key = 0; _key < _len; _key++) {
    funcs[_key] = arguments[_key];
  }

  if (funcs.length === 0) {
    return function (arg) {
      return arg;
    };
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  var last = funcs[funcs.length - 1];
  var rest = funcs.slice(0, -1);
  return function () {
    return rest.reduceRight(function (composed, f) {
      return f(composed);
    }, last.apply(undefined, arguments));
  };
}
},{}],6:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports.ActionTypes = undefined;
exports['default'] = createStore;

var _isPlainObject = _dereq_('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

var _symbolObservable = _dereq_('symbol-observable');

var _symbolObservable2 = _interopRequireDefault(_symbolObservable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * These are private action types reserved by Redux.
 * For any unknown actions, you must return the current state.
 * If the current state is undefined, you must return the initial state.
 * Do not reference these action types directly in your code.
 */
var ActionTypes = exports.ActionTypes = {
  INIT: '@@redux/INIT'
};

/**
 * Creates a Redux store that holds the state tree.
 * The only way to change the data in the store is to call `dispatch()` on it.
 *
 * There should only be a single store in your app. To specify how different
 * parts of the state tree respond to actions, you may combine several reducers
 * into a single reducer function by using `combineReducers`.
 *
 * @param {Function} reducer A function that returns the next state tree, given
 * the current state tree and the action to handle.
 *
 * @param {any} [preloadedState] The initial state. You may optionally specify it
 * to hydrate the state from the server in universal apps, or to restore a
 * previously serialized user session.
 * If you use `combineReducers` to produce the root reducer function, this must be
 * an object with the same shape as `combineReducers` keys.
 *
 * @param {Function} enhancer The store enhancer. You may optionally specify it
 * to enhance the store with third-party capabilities such as middleware,
 * time travel, persistence, etc. The only store enhancer that ships with Redux
 * is `applyMiddleware()`.
 *
 * @returns {Store} A Redux store that lets you read the state, dispatch actions
 * and subscribe to changes.
 */
function createStore(reducer, preloadedState, enhancer) {
  var _ref2;

  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState;
    preloadedState = undefined;
  }

  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error('Expected the enhancer to be a function.');
    }

    return enhancer(createStore)(reducer, preloadedState);
  }

  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.');
  }

  var currentReducer = reducer;
  var currentState = preloadedState;
  var currentListeners = [];
  var nextListeners = currentListeners;
  var isDispatching = false;

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }

  /**
   * Reads the state tree managed by the store.
   *
   * @returns {any} The current state tree of your application.
   */
  function getState() {
    return currentState;
  }

  /**
   * Adds a change listener. It will be called any time an action is dispatched,
   * and some part of the state tree may potentially have changed. You may then
   * call `getState()` to read the current state tree inside the callback.
   *
   * You may call `dispatch()` from a change listener, with the following
   * caveats:
   *
   * 1. The subscriptions are snapshotted just before every `dispatch()` call.
   * If you subscribe or unsubscribe while the listeners are being invoked, this
   * will not have any effect on the `dispatch()` that is currently in progress.
   * However, the next `dispatch()` call, whether nested or not, will use a more
   * recent snapshot of the subscription list.
   *
   * 2. The listener should not expect to see all state changes, as the state
   * might have been updated multiple times during a nested `dispatch()` before
   * the listener is called. It is, however, guaranteed that all subscribers
   * registered before the `dispatch()` started will be called with the latest
   * state by the time it exits.
   *
   * @param {Function} listener A callback to be invoked on every dispatch.
   * @returns {Function} A function to remove this change listener.
   */
  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected listener to be a function.');
    }

    var isSubscribed = true;

    ensureCanMutateNextListeners();
    nextListeners.push(listener);

    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }

      isSubscribed = false;

      ensureCanMutateNextListeners();
      var index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
    };
  }

  /**
   * Dispatches an action. It is the only way to trigger a state change.
   *
   * The `reducer` function, used to create the store, will be called with the
   * current state tree and the given `action`. Its return value will
   * be considered the **next** state of the tree, and the change listeners
   * will be notified.
   *
   * The base implementation only supports plain object actions. If you want to
   * dispatch a Promise, an Observable, a thunk, or something else, you need to
   * wrap your store creating function into the corresponding middleware. For
   * example, see the documentation for the `redux-thunk` package. Even the
   * middleware will eventually dispatch plain object actions using this method.
   *
   * @param {Object} action A plain object representing “what changed”. It is
   * a good idea to keep actions serializable so you can record and replay user
   * sessions, or use the time travelling `redux-devtools`. An action must have
   * a `type` property which may not be `undefined`. It is a good idea to use
   * string constants for action types.
   *
   * @returns {Object} For convenience, the same action object you dispatched.
   *
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to
   * return something else (for example, a Promise you can await).
   */
  function dispatch(action) {
    if (!(0, _isPlainObject2['default'])(action)) {
      throw new Error('Actions must be plain objects. ' + 'Use custom middleware for async actions.');
    }

    if (typeof action.type === 'undefined') {
      throw new Error('Actions may not have an undefined "type" property. ' + 'Have you misspelled a constant?');
    }

    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.');
    }

    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    var listeners = currentListeners = nextListeners;
    for (var i = 0; i < listeners.length; i++) {
      listeners[i]();
    }

    return action;
  }

  /**
   * Replaces the reducer currently used by the store to calculate the state.
   *
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   *
   * @param {Function} nextReducer The reducer for the store to use instead.
   * @returns {void}
   */
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.');
    }

    currentReducer = nextReducer;
    dispatch({ type: ActionTypes.INIT });
  }

  /**
   * Interoperability point for observable/reactive libraries.
   * @returns {observable} A minimal observable of state changes.
   * For more information, see the observable proposal:
   * https://github.com/zenparsing/es-observable
   */
  function observable() {
    var _ref;

    var outerSubscribe = subscribe;
    return _ref = {
      /**
       * The minimal observable subscription method.
       * @param {Object} observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * @returns {subscription} An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       */
      subscribe: function subscribe(observer) {
        if (typeof observer !== 'object') {
          throw new TypeError('Expected the observer to be an object.');
        }

        function observeState() {
          if (observer.next) {
            observer.next(getState());
          }
        }

        observeState();
        var unsubscribe = outerSubscribe(observeState);
        return { unsubscribe: unsubscribe };
      }
    }, _ref[_symbolObservable2['default']] = function () {
      return this;
    }, _ref;
  }

  // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.
  dispatch({ type: ActionTypes.INIT });

  return _ref2 = {
    dispatch: dispatch,
    subscribe: subscribe,
    getState: getState,
    replaceReducer: replaceReducer
  }, _ref2[_symbolObservable2['default']] = observable, _ref2;
}
},{"lodash/isPlainObject":12,"symbol-observable":13}],7:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports.compose = exports.applyMiddleware = exports.bindActionCreators = exports.combineReducers = exports.createStore = undefined;

var _createStore = _dereq_('./createStore');

var _createStore2 = _interopRequireDefault(_createStore);

var _combineReducers = _dereq_('./combineReducers');

var _combineReducers2 = _interopRequireDefault(_combineReducers);

var _bindActionCreators = _dereq_('./bindActionCreators');

var _bindActionCreators2 = _interopRequireDefault(_bindActionCreators);

var _applyMiddleware = _dereq_('./applyMiddleware');

var _applyMiddleware2 = _interopRequireDefault(_applyMiddleware);

var _compose = _dereq_('./compose');

var _compose2 = _interopRequireDefault(_compose);

var _warning = _dereq_('./utils/warning');

var _warning2 = _interopRequireDefault(_warning);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*
* This is a dummy function to check if the function name has been altered by minification.
* If the function has been minified and NODE_ENV !== 'production', warn the user.
*/
function isCrushed() {}

if ("development" !== 'production' && typeof isCrushed.name === 'string' && isCrushed.name !== 'isCrushed') {
  (0, _warning2['default'])('You are currently using minified code outside of NODE_ENV === \'production\'. ' + 'This means that you are running a slower development build of Redux. ' + 'You can use loose-envify (https://github.com/zertosh/loose-envify) for browserify ' + 'or DefinePlugin for webpack (http://stackoverflow.com/questions/30030031) ' + 'to ensure you have the correct code for your production build.');
}

exports.createStore = _createStore2['default'];
exports.combineReducers = _combineReducers2['default'];
exports.bindActionCreators = _bindActionCreators2['default'];
exports.applyMiddleware = _applyMiddleware2['default'];
exports.compose = _compose2['default'];
},{"./applyMiddleware":2,"./bindActionCreators":3,"./combineReducers":4,"./compose":5,"./createStore":6,"./utils/warning":8}],8:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = warning;
/**
 * Prints a warning in the console if it exists.
 *
 * @param {String} message The warning message.
 * @returns {void}
 */
function warning(message) {
  /* eslint-disable no-console */
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(message);
  }
  /* eslint-enable no-console */
  try {
    // This error was thrown as a convenience so that if you enable
    // "break on all exceptions" in your console,
    // it would pause the execution at this line.
    throw new Error(message);
    /* eslint-disable no-empty */
  } catch (e) {}
  /* eslint-enable no-empty */
}
},{}],9:[function(_dereq_,module,exports){
var overArg = _dereq_('./_overArg');

/** Built-in value references. */
var getPrototype = overArg(Object.getPrototypeOf, Object);

module.exports = getPrototype;

},{"./_overArg":10}],10:[function(_dereq_,module,exports){
/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

module.exports = overArg;

},{}],11:[function(_dereq_,module,exports){
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

module.exports = isObjectLike;

},{}],12:[function(_dereq_,module,exports){
var getPrototype = _dereq_('./_getPrototype'),
    isObjectLike = _dereq_('./isObjectLike');

/** `Object#toString` result references. */
var objectTag = '[object Object]';

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString.call(Object);

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  if (!isObjectLike(value) || objectToString.call(value) != objectTag) {
    return false;
  }
  var proto = getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return (typeof Ctor == 'function' &&
    Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString);
}

module.exports = isPlainObject;

},{"./_getPrototype":9,"./isObjectLike":11}],13:[function(_dereq_,module,exports){
module.exports = _dereq_('./lib/index');

},{"./lib/index":14}],14:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _ponyfill = _dereq_('./ponyfill');

var _ponyfill2 = _interopRequireDefault(_ponyfill);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var root = undefined; /* global window */

if (typeof global !== 'undefined') {
	root = global;
} else if (typeof window !== 'undefined') {
	root = window;
}

var result = (0, _ponyfill2['default'])(root);
exports['default'] = result;
},{"./ponyfill":15}],15:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports['default'] = symbolObservablePonyfill;
function symbolObservablePonyfill(root) {
	var result;
	var _Symbol = root.Symbol;

	if (typeof _Symbol === 'function') {
		if (_Symbol.observable) {
			result = _Symbol.observable;
		} else {
			result = _Symbol('observable');
			_Symbol.observable = result;
		}
	} else {
		result = '@@observable';
	}

	return result;
};
},{}],16:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.subscribe = exports.constants = exports.actions = exports.getState = undefined;

var _store = _dereq_('../src/store');

var _store2 = _interopRequireDefault(_store);

var _pages = _dereq_('./site/constants/pages');

var PAGES = _interopRequireWildcard(_pages);

var _statuses = _dereq_('./todos/constants/statuses');

var TODOS_STATUSES = _interopRequireWildcard(_statuses);

var _updateUrl = _dereq_('./site/actions/update-url');

var _updateUrl2 = _interopRequireDefault(_updateUrl);

var _updateSelectedPage = _dereq_('./site/actions/update-selected-page');

var _updateSelectedPage2 = _interopRequireDefault(_updateSelectedPage);

var _addTodo = _dereq_('./todos/actions/add-todo');

var _addTodo2 = _interopRequireDefault(_addTodo);

var _loadTodos = _dereq_('./todos/actions/load-todos');

var _loadTodos2 = _interopRequireDefault(_loadTodos);

var _removeTodo = _dereq_('./todos/actions/remove-todo');

var _removeTodo2 = _interopRequireDefault(_removeTodo);

var _completeTodo = _dereq_('./todos/actions/complete-todo');

var _completeTodo2 = _interopRequireDefault(_completeTodo);

var _updateSelectedSummaryStatus = _dereq_('./todos/actions/update-selected-summary-status');

var _updateSelectedSummaryStatus2 = _interopRequireDefault(_updateSelectedSummaryStatus);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var actionsSet = {
	site: {
		updateURL: _updateUrl2.default,
		updateSelectedPage: _updateSelectedPage2.default
	},
	todos: {
		addTodo: _addTodo2.default,
		loadTodos: _loadTodos2.default,
		removeTodo: _removeTodo2.default,
		completeTodo: _completeTodo2.default,
		updateSelectedSummaryStatus: _updateSelectedSummaryStatus2.default
	}
};

var actions = Object.keys(actionsSet).reduce(function (p1, key1) {
	p1[key1] = Object.keys(actionsSet[key1]).reduce(function (p2, key2) {
		p2[key2] = function () {
			var action = actionsSet[key1][key2].apply(null, arguments);
			_store2.default.dispatch(action);
			return action;
		};
		return p2;
	}, {});
	return p1;
}, {});

var constants = {
	PAGES: PAGES,
	TODOS_STATUSES: TODOS_STATUSES
};

var subscribe = _store2.default.subscribe;

var getState = _store2.default.getState;

exports.default = {
	getState: getState,
	actions: actions,
	constants: constants,
	subscribe: subscribe
};
exports.getState = getState;
exports.actions = actions;
exports.constants = constants;
exports.subscribe = subscribe;

},{"../src/store":23,"./site/actions/update-selected-page":17,"./site/actions/update-url":18,"./site/constants/pages":19,"./todos/actions/add-todo":24,"./todos/actions/complete-todo":25,"./todos/actions/load-todos":26,"./todos/actions/remove-todo":27,"./todos/actions/update-selected-summary-status":28,"./todos/constants/statuses":30}],17:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (newSelectedPage) {
	return function (dispatch, getState) {
		var _getState = getState();

		var selectedPage = _getState.selectedPage;

		if (selectedPage !== newSelectedPage) {
			dispatch({ type: UPDATE_SELECTED_PAGE, selectedPage: newSelectedPage });
		}
	};
};

var UPDATE_SELECTED_PAGE = exports.UPDATE_SELECTED_PAGE = 'UPDATE_SELECTED_PAGE';

},{}],18:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (newURL) {
	return function (dispatch, getState) {
		var _getState = getState();

		var url = _getState.url;

		if (newURL === url) {
			return;
		}

		var splitURL = newURL.split('?');
		var path = splitURL[0];
		var searchParams = {};

		if (splitURL.length >= 2) {
			searchParams = parseSearchParams(splitURL[1]);
		}

		dispatch({ type: UPDATE_URL, parsedURL: { path: path, searchParams: searchParams, url: newURL } });
	};
};

var UPDATE_URL = exports.UPDATE_URL = 'UPDATE_URL';

function parseSearchParams(searchString) {
	var pairSplit = void 0;
	return (searchString || '').replace(/^\?/, '').split('&').reduce(function (p, pair) {
		pairSplit = pair.split('=');
		if (pairSplit.length >= 1 && pairSplit[0].length >= 1) {
			p[decodeURIComponent(pairSplit[0])] = decodeURIComponent(pairSplit[1]) || '';
		}
		return p;
	}, {});
}

},{}],19:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var HOME = exports.HOME = 'HOME';
var ABOUT = exports.ABOUT = 'ABOUT';

},{}],20:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.DEFAULT_PATH = exports.PATHS = undefined;

var _pages = _dereq_('../../site/constants/pages');

var PATHS = exports.PATHS = {
	'/': _pages.HOME,
	'/about': _pages.ABOUT
};

var DEFAULT_PATH = exports.DEFAULT_PATH = '/';

},{"../../site/constants/pages":19}],21:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function () {
	var selectedPage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _pages.HOME;
	var action = arguments[1];

	switch (action.type) {

		case _updateSelectedPage.UPDATE_SELECTED_PAGE:
			return action.selectedPage;

		case _updateUrl.UPDATE_URL:
			return _paths.PATHS[action.parsedURL.path] || _pages.HOME;

		default:
			return selectedPage;
	}
};

var _updateSelectedPage = _dereq_('../../site/actions/update-selected-page');

var _updateUrl = _dereq_('../../site/actions/update-url');

var _pages = _dereq_('../../site/constants/pages');

var _paths = _dereq_('../../site/constants/paths');

},{"../../site/actions/update-selected-page":17,"../../site/actions/update-url":18,"../../site/constants/pages":19,"../../site/constants/paths":20}],22:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function () {
	var url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _paths.DEFAULT_PATH;
	var action = arguments[1];

	switch (action.type) {

		case _updateUrl.UPDATE_URL:
			return action.parsedURL.url;

		default:
			return url;
	}
};

var _updateUrl = _dereq_('../../site/actions/update-url');

var _paths = _dereq_('../../site/constants/paths');

},{"../../site/actions/update-url":18,"../../site/constants/paths":20}],23:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _redux = _dereq_('redux');

var _reduxThunk = _dereq_('redux-thunk');

var _reduxThunk2 = _interopRequireDefault(_reduxThunk);

var _url = _dereq_('./site/reducers/url');

var _url2 = _interopRequireDefault(_url);

var _selectedPage = _dereq_('./site/reducers/selected-page');

var _selectedPage2 = _interopRequireDefault(_selectedPage);

var _todos = _dereq_('./todos/reducers/todos');

var _todos2 = _interopRequireDefault(_todos);

var _selectedSummaryStatus = _dereq_('./todos/reducers/selected-summary-status');

var _selectedSummaryStatus2 = _interopRequireDefault(_selectedSummaryStatus);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// reducers
var reducers = {
	url: _url2.default,
	selectedPage: _selectedPage2.default,
	todos: _todos2.default,
	selectedSummaryStatus: _selectedSummaryStatus2.default
};

// middleware that logs all actions to console
var consoleLog = function consoleLog(store) {
	return function (next) {
		return function (action) {
			if (typeof action !== 'function') {
				console.log(action);
			}
			return next(action);
		};
	};
};

// middleware
var middleWare = void 0;
if (process.env.NODE_ENV !== 'production') {
	middleWare = (0, _redux.applyMiddleware)(consoleLog, _reduxThunk2.default);
} else {
	middleWare = (0, _redux.applyMiddleware)(_reduxThunk2.default);
}

// create store
exports.default = (0, _redux.createStore)((0, _redux.combineReducers)(reducers), middleWare);

},{"./site/reducers/selected-page":21,"./site/reducers/url":22,"./todos/reducers/selected-summary-status":31,"./todos/reducers/todos":32,"redux":7,"redux-thunk":1}],24:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (description) {
	return function (dispatch, getState) {
		if (!description || !description.length) {
			return Promise.resolve(null);
		}

		return (0, _newTodo2.default)(description).then(function (todo) {
			var id = todo.id;
			delete todo.id;
			dispatch((0, _updateTodos3.default)(_defineProperty({}, id, todo)));
		});
	};
};

var _newTodo = _dereq_('../../todos/services/fake-backend/new-todo');

var _newTodo2 = _interopRequireDefault(_newTodo);

var _updateTodos2 = _dereq_('../../todos/actions/update-todos');

var _updateTodos3 = _interopRequireDefault(_updateTodos2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

},{"../../todos/actions/update-todos":29,"../../todos/services/fake-backend/new-todo":35}],25:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (id, isComplete) {
	return function (dispatch, getState) {
		var _getState = getState();

		var todos = _getState.todos;

		var todo = todos[id];

		if (!todo) {
			return;
		}

		todo.isComplete = isComplete;

		return (0, _saveTodo2.default)(id, todo).then(function (res) {
			dispatch((0, _updateTodos3.default)(_defineProperty({}, res.id, res.todo)));
		});
	};
};

var _saveTodo = _dereq_('../../todos/services/fake-backend/save-todo');

var _saveTodo2 = _interopRequireDefault(_saveTodo);

var _updateTodos2 = _dereq_('../../todos/actions/update-todos');

var _updateTodos3 = _interopRequireDefault(_updateTodos2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

},{"../../todos/actions/update-todos":29,"../../todos/services/fake-backend/save-todo":36}],26:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.LOAD_TODOS = undefined;

exports.default = function (todos) {
	return function (dispatch, getState) {
		return (0, _loadAllTodos2.default)().then(function (todos) {
			if (!todos) {
				return Promise.resolve(null);
			}
			dispatch((0, _updateTodos2.default)(todos));
		});
	};
};

var _loadAllTodos = _dereq_('../../todos/services/fake-backend/load-all-todos');

var _loadAllTodos2 = _interopRequireDefault(_loadAllTodos);

var _updateTodos = _dereq_('../../todos/actions/update-todos');

var _updateTodos2 = _interopRequireDefault(_updateTodos);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var LOAD_TODOS = exports.LOAD_TODOS = 'LOAD_TODOS';

},{"../../todos/actions/update-todos":29,"../../todos/services/fake-backend/load-all-todos":34}],27:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (id) {
	return function (dispatch, getState) {
		return (0, _deleteTodo2.default)(id).then(function (todo) {
			dispatch((0, _updateTodos3.default)(_defineProperty({}, id, null)));
		});
	};
};

var _deleteTodo = _dereq_('../../todos/services/fake-backend/delete-todo');

var _deleteTodo2 = _interopRequireDefault(_deleteTodo);

var _updateTodos2 = _dereq_('../../todos/actions/update-todos');

var _updateTodos3 = _interopRequireDefault(_updateTodos2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

},{"../../todos/actions/update-todos":29,"../../todos/services/fake-backend/delete-todo":33}],28:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (selectedSummaryStatus) {
	return { type: UPDATE_SELECTED_SUMMARY_STATUS, selectedSummaryStatus: selectedSummaryStatus };
};

var UPDATE_SELECTED_SUMMARY_STATUS = exports.UPDATE_SELECTED_SUMMARY_STATUS = 'UPDATE_SELECTED_SUMMARY_STATUS';

},{}],29:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (todos) {
	return { type: UPDATE_TODOS, todos: todos };
};

var UPDATE_TODOS = exports.UPDATE_TODOS = 'UPDATE_TODOS';

},{}],30:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var PENDING = exports.PENDING = 'PENDING';
var COMPLETE = exports.COMPLETE = 'COMPLETE';
var TOTAL = exports.TOTAL = 'TOTAL';

},{}],31:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function () {
	var selectedSummaryStatus = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _statuses.TOTAL;
	var action = arguments[1];

	switch (action.type) {
		case _updateSelectedSummaryStatus.UPDATE_SELECTED_SUMMARY_STATUS:
			return action.selectedSummaryStatus;

		default:
			return selectedSummaryStatus;
	}
};

var _updateSelectedSummaryStatus = _dereq_('../../todos/actions/update-selected-summary-status');

var _statuses = _dereq_('../../todos/constants/statuses');

},{"../../todos/actions/update-selected-summary-status":28,"../../todos/constants/statuses":30}],32:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = function () {
	var todos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	var action = arguments[1];

	var newTodos = void 0;

	switch (action.type) {
		case _updateTodos.UPDATE_TODOS:
			newTodos = _extends({}, todos);

			Object.keys(action.todos).forEach(function (key) {
				if (action.todos[key]) {
					newTodos[key] = action.todos[key];
				} else {
					delete newTodos[key];
				}
			});

			return newTodos;

		default:
			return todos;
	}
};

var _updateTodos = _dereq_('../../todos/actions/update-todos');

},{"../../todos/actions/update-todos":29}],33:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (id) {
	return new Promise(function (r, x) {
		setTimeout(function () {
			return r(true);
		}, 50);
	});
};

},{}],34:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function () {
	var todos = {
		'10': {
			description: 'Buy tomatoes from grocery store',
			dateCreated: '2016-09-19T18:44:15.635',
			isComplete: false
		},
		'3': {
			description: 'Finish writing blog post',
			dateCreated: '2016-09-20T18:44:18.635',
			isComplete: false
		}
	};

	return new Promise(function (r, x) {
		setTimeout(function () {
			return r(todos);
		}, 50);
	});
};

},{}],35:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (description) {
	var id = Math.round(Math.random() * 10000).toFixed();
	var newTodo = {
		id: id,
		description: description,
		dateCreated: new Date().toISOString(),
		isComplete: false
	};

	return new Promise(function (r, x) {
		setTimeout(function () {
			return r(newTodo);
		}, 50);
	});
};

},{}],36:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (id, todo) {
	return new Promise(function (r, x) {
		setTimeout(function () {
			return r({ id: id, todo: todo });
		}, 50);
	});
};

},{}]},{},[16])(16)
});
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":5}],8:[function(require,module,exports){
'use strict';

var _todoReduxState = require('todo-redux-state');

var _todoReactComponents = require('todo-react-components');

var _selectors = require('./selectors');

var _selectors2 = _interopRequireDefault(_selectors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// debug stuff
Object.defineProperty(window, "state", { get: _todoReduxState.getState });
window.selectors = _selectors2.default;
window.actions = _todoReduxState.actions;
console.log('********************************************* \n DEVELOPMENT MODE \n window.state available \n window.selectors available \n ********************************************* \n');

// read the url and navigate to the right page
_todoReduxState.actions.site.updateURL(window.location.pathname + window.location.search);

// load todos
_todoReduxState.actions.todos.loadTodos();

// listen for back button, forward button, etc
window.onpopstate = function (e) {
    _todoReduxState.actions.site.updateURL(window.location.pathname + window.location.search);
};

// subscribe to state changes and re-render view on every change
var htmlElement = document.getElementById('app');
(0, _todoReduxState.subscribe)(function () {
    return (0, _todoReactComponents.render)(_selectors2.default, htmlElement);
});

},{"./selectors":11,"todo-react-components":6,"todo-redux-state":7}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.selectAboutLink = undefined;

exports.default = function (state) {
	return selectAboutLink();
};

var _memoizerific = require('memoizerific');

var _memoizerific2 = _interopRequireDefault(_memoizerific);

var _todoReduxState = require('todo-redux-state');

var _paths = require('../site/constants/paths');

var PATHS = _interopRequireWildcard(_paths);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var selectAboutLink = exports.selectAboutLink = (0, _memoizerific2.default)(1)(function () {
	var url = PATHS[_todoReduxState.constants.PAGES.ABOUT];
	return {
		label: 'About',
		href: url,
		onClick: function onClick() {
			return _todoReduxState.actions.site.updateURL(url);
		}
	};
});

},{"../site/constants/paths":12,"memoizerific":4,"todo-redux-state":7}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.selectHomeLink = undefined;

exports.default = function (state) {
	return selectHomeLink();
};

var _memoizerific = require('memoizerific');

var _memoizerific2 = _interopRequireDefault(_memoizerific);

var _todoReduxState = require('todo-redux-state');

var _paths = require('../site/constants/paths');

var PATHS = _interopRequireWildcard(_paths);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var selectHomeLink = exports.selectHomeLink = (0, _memoizerific2.default)(1)(function () {
	var url = PATHS[_todoReduxState.constants.PAGES.HOME];
	return {
		label: 'Home',
		href: url,
		onClick: function onClick() {
			return _todoReduxState.actions.site.updateURL(url);
		}
	};
});

},{"../site/constants/paths":12,"memoizerific":4,"todo-redux-state":7}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _combineSelectors = require('combine-selectors');

var _combineSelectors2 = _interopRequireDefault(_combineSelectors);

var _todoReduxState = require('todo-redux-state');

var _selectedPage = require('./site/selected-page');

var _selectedPage2 = _interopRequireDefault(_selectedPage);

var _url = require('./site/url');

var _url2 = _interopRequireDefault(_url);

var _siteHeader = require('./site/site-header');

var _siteHeader2 = _interopRequireDefault(_siteHeader);

var _todos = require('./todos/todos');

var _todos2 = _interopRequireDefault(_todos);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var selectors = {
	selectedPage: _selectedPage2.default,
	url: _url2.default,
	siteHeader: _siteHeader2.default,
	todos: _todos2.default
};

exports.default = (0, _combineSelectors2.default)(selectors, _todoReduxState.getState);

},{"./site/selected-page":13,"./site/site-header":14,"./site/url":15,"./todos/todos":16,"combine-selectors":1,"todo-redux-state":7}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var HOME = exports.HOME = '/';
var ABOUT = exports.ABOUT = '/about';

},{}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.selectSelectedPage = undefined;

exports.default = function (state) {
	var selectedPage = state.selectedPage;

	return selectSelectedPage(selectedPage);
};

var _memoizerific = require('memoizerific');

var _memoizerific2 = _interopRequireDefault(_memoizerific);

var _todoReactComponents = require('todo-react-components');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var selectSelectedPage = exports.selectSelectedPage = (0, _memoizerific2.default)(1)(function (selectedPage) {
	return _todoReactComponents.constants.PAGES[selectedPage];
});

},{"memoizerific":4,"todo-react-components":6}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.selectSiteHeader = undefined;

exports.default = function (state) {
	var selectedPage = state.selectedPage;

	return selectSiteHeader(selectedPage);
};

var _memoizerific = require('memoizerific');

var _memoizerific2 = _interopRequireDefault(_memoizerific);

var _paths = require('../site/constants/paths');

var PATHS = _interopRequireWildcard(_paths);

var _home = require('../links/home');

var _about = require('../links/about');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var selectSiteHeader = exports.selectSiteHeader = (0, _memoizerific2.default)(1)(function (selectedPage) {
	return {
		selectedPage: selectedPage,
		homeLink: (0, _home.selectHomeLink)(),
		aboutLink: (0, _about.selectAboutLink)()
	};
});

},{"../links/about":9,"../links/home":10,"../site/constants/paths":12,"memoizerific":4}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (state) {
	var url = state.url;

	return url;
};

},{}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.selectTodos = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = function (state) {
	var todos = state.todos;
	var selectedSummaryStatus = state.selectedSummaryStatus;


	return selectTodos(todos, selectedSummaryStatus);
};

var _memoizerific = require('memoizerific');

var _memoizerific2 = _interopRequireDefault(_memoizerific);

var _todoReduxState = require('todo-redux-state');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _actions$todos = _todoReduxState.actions.todos;
var addTodo = _actions$todos.addTodo;
var removeTodo = _actions$todos.removeTodo;
var completeTodo = _actions$todos.completeTodo;
var updateSelectedSummaryStatus = _actions$todos.updateSelectedSummaryStatus;
var TODOS_STATUSES = _todoReduxState.constants.TODOS_STATUSES;
var selectTodos = exports.selectTodos = (0, _memoizerific2.default)(1)(function (todos, selectedSummaryStatus) {

	var newForm = {
		placeholder: 'What do you need to do?',
		onSubmit: function onSubmit(description) {
			return addTodo(description);
		}
	};

	var list = Object.keys(todos).map(function (key) {
		return _extends({}, todos[key], {
			id: key,
			buttonLabel: 'delete',
			onButtonClicked: function onButtonClicked() {
				return removeTodo(key);
			},
			onCheckboxToggled: function onCheckboxToggled() {
				return completeTodo(key, !todos[key].isComplete);
			}
		});
	});

	var summary = list.reduce(function (p, todo) {
		!todo.isComplete && p.countIncomplete++;
		todo.isComplete && p.countComplete++;
		p.countTotal++;
		return p;
	}, {
		countIncomplete: 0,
		countComplete: 0,
		countTotal: 0
	});

	list = list.filter(function (todo) {
		return selectedSummaryStatus === TODOS_STATUSES.TOTAL || selectedSummaryStatus === TODOS_STATUSES.COMPLETE && todo.isComplete || selectedSummaryStatus === TODOS_STATUSES.PENDING && !todo.isComplete;
	}).sort(function (a, b) {
		if (a.dateCreated < b.dateCreated) {
			return -1;
		}
		if (a.dateCreated > b.dateCreated) {
			return 1;
		}
		if (a.id < b.id) {
			return -1;
		}
		return 1;
	});

	summary.countIncomplete = summary.countIncomplete + ' pending';
	summary.countComplete = summary.countComplete + ' complete';
	summary.countTotal = summary.countTotal + ' total';

	summary.selectedSummaryStatus = selectedSummaryStatus;

	summary.onClickPending = function () {
		return updateSelectedSummaryStatus(TODOS_STATUSES.PENDING);
	};
	summary.onClickComplete = function () {
		return updateSelectedSummaryStatus(TODOS_STATUSES.COMPLETE);
	};
	summary.onClickTotal = function () {
		return updateSelectedSummaryStatus(TODOS_STATUSES.TOTAL);
	};

	return {
		newForm: newForm,
		list: list,
		summary: summary
	};
});

},{"memoizerific":4,"todo-redux-state":7}]},{},[8])
//# sourceMappingURL=build.js.map
