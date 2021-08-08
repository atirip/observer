function isCorrectType(type, val) {
	let jtype = Object.prototype.toString.call(val).slice(8, 9);
	if (jtype == 'N') {
		// Object.prototype.toString.call(null) -> [object Null]
		if (type == 'O' && val === null) return true;
		return /[N,I,F]/.test(type);
	}
	return type == jtype;
}

function arrayLike(val) {
	return Array.isArray(val) || (typeof val == 'object' && (val instanceof Set || (val && 'item' in val && 'length' in val)));
}

function getType(key, index = 0) {
	let h;
	let type;
	do {
		h = key.split('_');
		if (h.length < index + 2 || !h[index].length) break;
		h = h[index];
		type = h.charAt(0).toUpperCase();
		if (!/B|N|I|F|S|O|A/.test(type)) type = undefined;
		break;
	} while (true);
	return { h, type };
}

function validateProperty(key, op, valueRef) {
	/*
		// property-trap: validate(obj, 'delete', key, valueRef, prev);
		let h = key.split('_');
		if (h.length < 2 || !h[0].length) return true;
		h = h[0];
		let type = h.charAt(0).toUpperCase();
		if (!/[B,N,I,F,S,O,A]/.test(type)) return true;
		*/
	let { h, type } = getType(key, 0);
	if (!type) return true;

	let val = valueRef.value;

	if (h.includes('t') && !isCorrectType(type, val)) return false;

	if (op == 'delete') {
		if (h.includes('r')) {
			valueRef.value = {
				B: false,
				N: 0,
				I: 0,
				F: 0,
				S: '',
				O: {},
				A: [],
			}[type];
		} else {
			valueRef.value = undefined;
		}
		return true;
	}

	if (op == 'set') {
		// cast
		let ok = true;
		valueRef.value = {
			B: () => {
				return !!val;
			},
			N: () => {
				// +[] === 0 and this is not what anyone expects here, return NaN as with Object
				if (arrayLike(val)) return NaN;
				return +val;
			},
			I: () => {
				return parseInt(val, 10);
			},
			F: () => {
				return parseFloat(val);
			},
			S: () => {
				if (val == null) {
					val = '';
				} else if (typeof val == 'object') {
					ok = false;
				} else {
					val = String(val);
				}
				return val;
			},
			O: () => {
				//TODO allow Maps?
				if (typeof val == 'object') {
					if (arrayLike(val)) ok = false;
				} else {
					ok = false;
				}
				return val;
			},
			A: () => {
				if (!Array.isArray(val)) {
					if (arrayLike(val)) {
						val = Array.from(val);
					} else {
						// this val can not be cast to array
						ok = false;
					}
				}
				return val;
			},
		}[type]();

		if (/N|I|F]/.test(type) && h.includes('z') && valueRef.value !== Number(valueRef.value)) {
			valueRef.value = 0;
		}

		return ok;
	}
}
/*
	o = {
		b_foo: false,
		a_b_blaah: [],
	}
	
*/
function validateArrayMutation(key, op, args) {
	let { h, type } = getType(key, 1);
	if (!type || !/splice|push|shift/.test(op)) return true;
	let start = op == 'splice' ? 3 : 0;
	let valueRef = {};
	h += '_';
	for (let [index, val] of args.entries()) {
		if (index < start) continue;
		valueRef.value = val;
		if (validateProperty(h, 'set', valueRef)) {
			if (valueRef.value !== val) {
				args[index] = valueRef.value;
			}
		} else {
			return false;
		}
	}
	return true;
}

export { isCorrectType, validateProperty, validateArrayMutation };
