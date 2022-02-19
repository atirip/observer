/*
	target.prop != source.prop - overwrite
	target has prop && source does not -> remove prop from target
	source has prop && target has not -> add prop to target

*/

let debug = true
	? function (...args) {
			console.log.apply(console, args);
	  }
	: function () {};

function typeStr(val) {
	return Object.prototype.toString.call(val).slice(8, -1).toLowerCase();
}

function simpleEqual(a, b) {
	return a == b;
}

function isObject(type) {
	return type == 'array' || type == 'object';
}

function patchElement(target, source, prop, equal) {
	let sourceType = typeStr(source[prop]);
	let targetType = typeStr(target[prop]);
	if (isObject(sourceType) && sourceType == targetType) {
		//same type of object
		sourceType == 'array' ? patchArray(target[prop], source[prop], equal) : patchObject(target[prop], source[prop], equal);
	} else {
		if (!equal(target[prop], source[prop])) {
			if (!(prop in target)) {
				debug(`create ${source[prop]} as ${prop}`);
			} else {
				debug(`assign ${source[prop]} to ${prop}`);
			}
			target[prop] = source[prop];
		}
	}
}

function patchArray(target, source, equal) {
	let i = Math.min(source.length, target.length);
	while (i--) {
		patchElement(target, source, i, equal);
	}
	if (source.length < target.length) {
		target.length = source.length;
		debug(`assign new length: ${source.length}`);
	} else if (source.length > target.length) {
		i = source.length - target.length;
		while (i--) {
			patchElement(target, source, target.length + i, equal);
		}
	}
}

function patchObject(target, source, equal) {
	let targetKeys = Object.keys(target);
	let sourceKeys = Object.keys(source);

	let i = targetKeys.length;
	while (i--) {
		let prop = targetKeys[i];
		if (!sourceKeys.includes(prop)) {
			delete target[prop];
			debug(`delete: ${prop}`);
		}
	}

	i = sourceKeys.length;
	while (i--) {
		let prop = sourceKeys[i];
		patchElement(target, source, prop, equal);
	}
}

function patch(target, source, equal = simpleEqual) {
	let sourceType = typeStr(source);
	if (sourceType == 'array') {
		patchArray(target, source, equal);
	} else if (sourceType == 'object') {
		patchObject(target, source, equal);
	} else {
		if (!equal(target, source)) {
			target = source;
		}
	}
	return target;
}

export { patch };
