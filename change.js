import { extend } from './utils.js';
import { path } from './observer.js';
import { ArrayUndoRedo, PropertyUndoRedo } from './undo-redo.js';

function applyChanges(target, method, changes, createObject) {
	function prepareObjects(obj, arr) {
		if ('validate' in obj) {
			arr = obj.validate(arr);
		}
		return arr;
	}

	function applyChange(change) {
		let [pth, op] = change;
		let propOp = op == 'set' || op == 'delete';

		let keys = pth ? pth.split('/') : [];
		if (pth.charAt(0) == '/') keys.shift();
		let obj = target;
		for (let key of keys.values()) {
			obj = obj[key];
		}
		let args = Array.prototype.slice.call(change, 1);
		if (args[0] == 'splice') {
			for (let i of [2, 3]) args[i] = prepareObjects(obj, args[i]);
		}
		(propOp ? PropertyUndoRedo : ArrayUndoRedo)[method](obj, args, createObject ? createObject.bind(obj) : undefined);
	}
	if (!Array.isArray(changes[0])) {
		applyChange(changes);
	} else {
		if (method == 'redo') {
			for (let i = 0; i < changes.length; i++) {
				applyChange(changes[i]);
			}
		} else {
			let i = changes.length;
			while (i--) {
				applyChange(changes[i]);
			}
		}
	}
}

function getChange(filter, target, ...args) {
	let pth = path(target);
	if (!filter || filter(pth)) {
		args = extend(args);
		return [pth, ...args];
	}
	return [];
}

export { applyChanges, getChange };
