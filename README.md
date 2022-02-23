

# Object Observer

Observing and validation Proxy for Objects and Arrays.

## Why?

Creating Proxy is easy, but the result is hardly useful out of the box.


Object Observer:

1) Has nesting suppport, nested objects are automatically proxified

2) Has full array support, array changes are detected as one transform, not like sequence of property changes

3) Has path support, changes in nested objects are meaningful in root object context

4) Has undo/redo/snapshot support, all recorded changes can be applied back and forth

5) Keeps "shadow pure" object fully in sync with proxied one


## Example

```js
import { path as getPath, createObserver } from './observer.js';

function stringify(val) {
	return typeof val == 'object' && val ? JSON.stringify(val) : val;
}

function createSimpleProxy(obj) {
	return new Proxy(obj, {
		set(target, prop, val, receiver) {
			try {
				return Reflect.set(target, prop, val, receiver);
			} finally {
				console.log(`changed '${prop}' to '${stringify(val)}'`);
			}
		},
	});
}
	
function createProxy(obj) {
	return createObserver(obj, {onchange: function explain(target, op, ...args) {
		let path;
		let desc = '';
		if (Array.isArray(target)) {
			path = '/' + getPath(target);
			desc = args.map((a) => stringify(a)).join(',');
		} else {
			let [prop, newValue] = args;
			path = '/' + getPath(target, prop);
			if (op != 'delete') desc = stringify(newValue);
		}
		console.log(`${op} '${path}' to '${desc}'`);
	}});
}

// Objects
let simple = createSimpleProxy({ name: 'John' });

let pure = { name: 'John' };
let observer = createProxy(pure);

// this 'pure' object is always in sync with proxied ones
JSON.stringify(pure) == JSON.stringify(observer); // true

simple.name = 'Pete'; // changed "name" to "Pete"
observer.name = 'Pete'; // set 'name' to 'Pete'

simple.data = { address: 'Silicon Valley' }; // changed 'data' to '{"address":"Silicon Valley"}'
// no change detected
simple.data.address = 'New York'; //

observer.data = { address: 'Silicon Valley' }; // set '/data' to '{"address":"Silicon Valley"}'
// change is detected with path
observer.data.address = 'New York'; // set '/data/address' to 'New York'

// no additional properties to mess up the "pure" Object
console.log(Object.keys(observer)); // ["name", "data"]

// Arrays
let simpleArray = createSimpleProxy([1, 2, 3]);
simpleArray.shift();
// outputs:
// [2, 2, 3] "changed '0' to '2'"
// [2, 3, 3] "changed '1' to '3'"
// [2, 3] "changed 'length' to '2'"

let array = createProxy([1, 2, 3]);
array.shift(); // splice: 0,[1],[]
// meaning spliced at index 0, removed [1] and inserted nothing, every array mutation description has specific arguments

// "pure" object is always deep equal to proxied one
JSON.stringify(pure) == JSON.stringify(observer); // true

// Proxied objects are not clonable
function idbtest(data) {
	let open = window.indexedDB.open('db', 1);
	let store = 'store';
	open.onupgradeneeded = function() {
		open.result.createObjectStore(store);
	}
	open.onsuccess = function() {
		let tx = open.result.transaction(store, 'readwrite');
		tx.objectStore(store).put(data, 'test');
		tx.oncomplete = function() {
			console.log('transaction complete');
		}
	}	
}

idbtest(observer); // put failed: DOMException: Failed to execute 'put' on 'IDBObjectStore': #<Object> could not be cloned.

// we can always use 'pure' object
idbtest(pure); // transaction complete


// Proxy is slow to read, when in need of extensive reads, one can always safely read from 'pure' object
// try one million reads
let max = 1000000;
console.time('pure read');
for (let i = 0; i < max; i++) {
	let a = pure.data.address;
}
console.timeEnd('pure read'); // pure read: 4.2470703125 ms

console.time('proxy read');
for (let i = 0; i < max; i++) {
	let a = observer.data.address;
}
console.timeEnd('proxy read'); // proxy read: 282.31201171875 ms
```

## Usage

This repository only contains pure ES6 modules (consumable in browsers without transpiling) and nothing else. 
If that is not enough, then recommended usage is to fork and then adjust, transpile, bundle, whatever one needs.

```js
import {createObserver} from './observer/observer.js';

let original = {};

let proxy = createObserver(original, {onchange: function onchange(target, ...args) {
	/*
		target is the object changed
		
		args will be:
		
		on object property or array direct access:
			'delete', property, new value, previous value
			'set', property, new value, previous value

		on array mutation functions or direct length change:
			'splice', start, array of deleted elements, array of inserted elements
			'sort', array of changes in format [newIndex, prevIndex]
			'reverse'
			'copyWithin', target, start, array of overwritten elements;
			'fill', fillValue, start, array of overwritten elements;
			'length', len, previous length (if new length > previous length) or array of removed elements
			
		array mutation functions 'push', 'pop', 'shift', 'unshift' are reported as calls to 'splice'
		
	*/
}})
```

There is opportunity to specify 3rd party equal function, like if one wants to support deep-equal comparisons. That if beneficial for example
when replacing structure with deep-equal strucure, normally whole structure is then replaced.

```js
import {createObserver} from './observer/observer.js';

import {deepEqual} from 'deep-equal.js';

let proxy = createObserver({}, {
	onchange: function onchange(target, ...args) {
	},
	equal: function(a,b) {
		return deepEqual(a,b);
	}
})
```

There is opportunity to specify 3rd party patch function (ore one can use patch.js provided in this repo) to patch/sync structures without replacing
them wholly. 

```js
import {createObserver} from './observer/observer.js';
import {patch} from './observer/patch.js';

let proxy = createObserver({}, {
	onchange: function onchange(target, ...args) {
	},
	patchObjects: function(target, newValue) {
		// return truthy falsy of whether something is patched
		return !!patch(target, newValue);
	}
})
```

