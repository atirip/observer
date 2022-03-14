/*
	target.prop != source.prop - overwrite
	target has prop && source does not -> remove prop from target
	source has prop && target has not -> add prop to target

*/

function typeStr(val) {
	return Object.prototype.toString.call(val).slice(8, -1).toLowerCase();
}

function isObject(type) {
	return type == 'array' || type == 'object';
}

function setProp(target, prop, value, deleteProperties, self) {
	if (value === undefined && deleteProperties) {
		delete target[prop];
	} else {
		target[prop] = value;
	}
	return target;
}

function patch(
	target,
	source,
	{
		equal = function simpleEqual(a, b, deep) {
			return a === b;
		},
		deleteProperties = true,
		set = setProp,
	} = {}
) {
	let res = -1; //failure

	function patchElement(target, source, prop) {
		let sourceType = typeStr(source[prop]);
		let targetType = typeStr(target[prop]);
		// opportunity to use deep equal comparator
		if (!equal(target[prop], source[prop], true)) {
			if (isObject(sourceType) && sourceType == targetType) {
				//same type of object
				sourceType == 'array' ? patchArray(target[prop], source[prop]) : patchObject(target[prop], source[prop]);
			} else {
				set(target, prop, source[prop], deleteProperties, setProp);
				res++;
			}
		}
	}

	function patchArray(target, source) {
		let i = Math.min(source.length, target.length);
		while (i--) {
			patchElement(target, source, i);
		}
		if (source.length < target.length) {
			target.length = source.length;
			res++;
		} else if (source.length > target.length) {
			i = source.length - target.length;
			while (i--) {
				patchElement(target, source, target.length + i);
			}
		}
	}

	function patchObject(target, source) {
		let targetKeys = Object.keys(target);
		let sourceKeys = Object.keys(source);

		let i = targetKeys.length;
		while (i--) {
			let prop = targetKeys[i];
			if (!sourceKeys.includes(prop)) {
				set(target, prop, undefined, deleteProperties, setProp);
				res++;
			}
		}

		i = sourceKeys.length;
		while (i--) {
			let prop = sourceKeys[i];
			patchElement(target, source, prop);
		}
	}

	let sourceType = typeStr(source);
	if (typeStr(target) == sourceType) {
		res++; 
		if (sourceType == 'array') {
			patchArray(target, source);
		} else if (sourceType == 'object') {
			patchObject(target, source);
		}
	}
	return res;
}

export { patch };
