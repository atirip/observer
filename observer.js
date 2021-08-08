import {ArrayTrap} from './array-trap.js';
import {PropertyTrap} from './property-trap.js';
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
	defineProperty(obj, parentSymbol, parent);
	defineProperty(obj, nameSymbol, name);
	for (let [key, child] of entries(obj)) {
		if (typeof child == 'object' && child) {
			defineParentsAndNames(child, obj, key);
		}
	}
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
	let p = (targetIsParents ? target : parents(target, true)).map(name).join('/');
	if (key !== undefined) p += '/' + key;
	return p.charAt(0) == '/' ? p.substr(1) : p;
}

function xpath(obj, p) {
	if (p !== String(p)) return;
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
	VALIDATE: target, property, operation, arguments
	
		on object: delete of set
			property, 'delete',  valueRef
			property, 'set',valueRef, prev
		
		on array: push or shift
			property, 'push', ...args
			property, 'shift', ...args

	ONCHANGE: target, operation, arguments
	
		on object property property or direct access of array element: delete or set
			property, 'delete',value, prev
			property, 'set', value, prev

		on array mutation functions or direct length change: splice, sort, reverse, copyWithin, length
			property, 'splice', start, deleted, inserted
			property, 'sort', map
			property, 'reverse'
			property, 'copyWithin', target, start, copied;
			property, 'fill', value, start, filled;
			property, 'length', len, prev
	*/

let map = new WeakMap();

function createObserver(
	source,
	onchange = () => {},
	validate = () => {
		return true;
	},
	name
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

			if (target[key] != value) {
				if (typeof value == 'function') {
					target[key] = value;
					return true;
				}

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


export { parentSymbol, nameSymbol, parent, path, xpath, createObserver };
