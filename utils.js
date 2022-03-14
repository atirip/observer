const emptyObject = {};
function getArrayFor(x, method) {
	if (x) {
		if (Array.isArray(x) || typeof x[method] == 'function') return x;
		// detecting array like
		if ('item' in x && 'length' in x) return Array.from(x);
	}
}

function entries(x) {
	let a = getArrayFor(x, 'entries');
	return a ? a.entries() : Object.entries(x || emptyObject);
}

function keys(x) {
	let a = getArrayFor(x, 'keys');
	return a ? a.keys() : Object.keys(x || emptyObject);
}

function values(x) {
	let a = getArrayFor(x, 'values');
	return a ? a.values() : Object.values(x || emptyObject);
}

let privateSymbol = Symbol('private');

function typeStr(val) {
	return Object.prototype.toString.call(val).slice(8, -1).toLowerCase();
}

function extend(/*dst,src1, src2, src3*/) {
	let p;
	let t;
	let src;
	let dst;
	let len = arguments.length;
	let i;

	// this allows easy clonig, you may use it foo = extend(bar) to do that
	if (len == 1) {
		t = typeStr(arguments[0]);
		if (t == 'array') {
			dst = [];
		}
		if (t == 'object') {
			dst = {};
		}
		i = 0;
	} else {
		dst = arguments[0];
		i = 1;
	}

	for (; i < len; i++) {
		src = arguments[i];

		// just pass non extendables through
		t = typeStr(src);
		if (!(t == 'array' || t == 'object')) {
			dst = src;
		} else {
			for (p in src) {
				t = typeStr(src[p]);
				dst[p] = t == 'array' || t == 'object' ? extend(dst[p] ? dst[p] : t == 'array' ? [] : {}, src[p]) : src[p];
			}
		}
	}

	return dst;
}

function empty(x) {
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	// undefined, '', null, 0, empty array
	if (!x || x.length === 0) {
		return true;
	}
	var type = typeStr(x);
	if (type == 'array') return;
	// empty {}
	if (type == 'object') {
		for (var n in x) {
			if (hasOwnProperty.call(x, n)) {
				return false;
			}
		}
		return true;
	}
	// convert to string and match single non-space character
	return !(x + '').match(/\S/);
}
export { privateSymbol, entries, keys, values, extend, typeStr, empty };
