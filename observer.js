import { ArrayTrap } from './array-trap.js';
import { PropertyTrap } from './property-trap.js';
import { values, entries, privateSymbol } from './utils.js';

const parentSymbol = Symbol('parent');
const nameSymbol = Symbol('name');

function defineProperty(obj, key, value) {
	if (value === undefined) return;
	Object.defineProperty(obj, key, {
		writable: true,
		value,
	});
}

function defineParentsAndNames(obj, parent, name) {
	let seen = new Set();

	function recursively(obj, parent, name) {
		if (seen.has(obj)) {
			return;
		} else {
			seen.add(obj);
		}
		defineProperty(obj, parentSymbol, parent);
		defineProperty(obj, nameSymbol, name);
		for (let [key, child] of entries(obj)) {
			if (child && typeof child == 'object') {
				recursively(child, obj, key);
			}
		}
	}

	recursively(obj, parent, name);
}

function parent(obj) {
	return obj[parentSymbol];
}

function parents(obj, andSelf, until) {
	var res = [];
	if (obj) {
		andSelf && res.push(obj);
		while ((obj = obj[parentSymbol])) {
			res.unshift(obj);
			if (until && until(obj)) break;
		}
	}
	return res;
}

function name(obj) {
	return obj[nameSymbol];
}

function path(target, key, targetIsParents) {
	return arrayPath.apply(this, arguments).join('/');
	/*
	let p = (targetIsParents ? target : parents(target, true)).map(name).join('/');
	if (key !== undefined) p += '/' + key;
	return p.charAt(0) == '/' ? p.substr(1) : p;
	*/
}

function arrayPath(target, key, targetIsParents) {
	let p = (targetIsParents ? target : parents(target, true)).map(name);
	if (key !== undefined) p.push(key);
	// root has no name
	if (!p[0]) p.shift();
	return p;
}

function retrieve(obj, p = '/') {
	if (p !== String(p)) return;

	if (p == '/') return obj;
	if (p.charAt(0) == '/') p = p.substr(1);

	let keys = p.split('/');
	if (name(obj)) keys.shift();
	for (let key of values(keys)) {
		obj = obj[key];
	}
	return obj;
}

function redefineArrayNames(target) {
	if (Array.isArray(target)) {
		for (let [index, child] of target.entries()) {
			if (typeof child == 'object' && child) {
				child[nameSymbol] = index;
			}
		}
	}
}

let win = globalThis;

/*
	VALIDATE: target, ...args

		target is the object changed

		args:
	
		on object:
			'delete', property, valueRef
			'set', property, valueRef, prev
		
		on object property validation valueRef is object with one property called value and can be changed. For example if incorrect type
		of value is provided, then inside validation it may be cast to correct type
		
		on array: 
			name of actual function called, array of actual arguments passed to that array function
			
		on array function call validation the arguments the arguments can be changed
		

	ONCHANGE: target, ...args

		target is the object changed

		args:

		on object property or array direct access:
			'delete', property, value, prev
			'set', property, value, prev

		on array mutation functions or direct length change:
			'splice', start, array of deleted elements, array of inserted elements
			'sort', array of changes in format [newIndex, prevIndex]
			'reverse'
			'copyWithin', target, start, array of overwritten elements;
			'fill', fillValue, start, array of overwritten elements;
			'length', len, prev
			
		array mutation functions 'push', 'pop', 'shift', 'unshift' are reported as calls to 'splice'
	*/

let map = new WeakMap();

function createObserver(
	source,
	{
		onchange = () => {},
		validate = () => {
			return true;
		},
		equal = (a, b) => {
			return a == b;
		},
		name = undefined,
		patchObjects = undefined,
		deleteProperties = true
	
	} = {}
) {


	let arrayTrap = new ArrayTrap();
	let propertyTrap = new PropertyTrap();

	defineParentsAndNames(source, null, name);

	let arrayIsMutating;

	let handler = {
		get(target, key) {
			let prop = target[key];

			if (Array.isArray(target) && typeof prop == 'function' && arrayTrap.functions.includes(key)) {
				return function (...args) {
					if (!validate(target, key, args)) return;
					arrayIsMutating = true;
					let res = arrayTrap[key](target, ...args);
					if (arrayTrap.change.length) {
						redefineArrayNames(target);
						onchange(target, ...arrayTrap.change);
					}
					arrayIsMutating = false;
					return res;
				};
			}

			if (typeof prop == 'object' && prop && key != parentSymbol && key != privateSymbol && !Object.getOwnPropertyDescriptor(prop, 'get')) {
				let proxy = map.get(prop);
				if (!proxy) {
					defineParentsAndNames(prop, target, key);
					proxy = new Proxy(prop, handler);
					map.set(prop, proxy);
				}
				return proxy;
			} else {
				return prop;
			}
		},

		set(target, key, value) {
			if (arrayIsMutating) return true;

			if (typeof value == 'function' && target[key] != value) {
				target[key] = value;
				return true;
			}

			if (!equal(target[key], value)) {
				if (Array.isArray(target) && key == 'length') {
					let res = arrayTrap[key](target, value);
					if (arrayTrap.change.length) {
						redefineArrayNames(target);
						onchange(target, ...arrayTrap.change);
					}
					return res;
				}

				let res = propertyTrap.setProperty(target, key, value, validate);
				res && onchange(target, ...propertyTrap.change);
				return res;
			}
			return true;
		},

		deleteProperty(target, key) {
			let res = propertyTrap.deleteProperty(target, key, validate);
			res && onchange(target, ...propertyTrap.change);
			return res;
		},
	};

	return new win.Proxy(source, handler);
}

export { parentSymbol, nameSymbol, parent, path, retrieve, createObserver, arrayPath };
