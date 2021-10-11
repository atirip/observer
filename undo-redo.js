function splice(arr, ...args) {
	return arr.splice(...args);
}

function passThrough(arr) {
	return arr;
}

class ArrayUndoRedo {
	static undo(arr, change, create) {
		let op = change[0];
		if (!create) create = passThrough;
		if (op == 'reverse') {
			arr.reverse();
		} else if (op == 'sort') {
			let map = change[1]; // [index now, index before]
			let copy = create(Array.from(arr));
			for (let [index, prevIndex] of map.values()) {
				arr[prevIndex] = copy[index];
			}
		} else if (op == 'splice') {
			let [, start, deleted, inserted] = change;
			splice(arr, start, inserted.length);
			splice(arr, start, 0, ...create(deleted));
		} else if (op == 'copyWithin') {
			let [, target, , copied] = change;
			copied = create(copied);
			for (let [index, value] of copied.entries()) {
				arr[index + target] = value;
			}
		} else if (op == 'fill') {
			let [, , start, filled] = change;
			// i doubt we need create() here in fill ever...
			for (let [index, value] of filled.entries()) {
				arr[index + start] = value;
			}
		} else if (op == 'length') {
			let [, len, prev] = change;
			if (Array.isArray(prev)) {
				splice(arr, len, 0, ...create(prev));
			} else {
				arr.length = prev;
			}
		}
	}

	static redo(arr, change, create) {
		let op = change[0];
		if (!create) create = passThrough;
		if (op == 'reverse') {
			create(arr).reverse();
		} else if (op == 'sort') {
			let map = change[1]; // [index now, index before]
			//let from = create(Array.from(arr));
			let to = Array.from(arr);
			for (let [index, prevIndex] of map.values()) {
				to[index] = arr[prevIndex];
			}
			splice(arr, 0, arr.length, ...to);
		} else if (op == 'splice') {
			let [, start, deleted, inserted] = change;
			splice(arr, start, deleted.length);
			splice(arr, start, 0, ...create(inserted));
		} else if (op == 'copyWithin') {
			let [, target, start, copied] = change;
			arr.copyWithin(target, start, start + copied.length);
		} else if (op == 'fill') {
			let [, value, start, prev] = change;
			// i doubt we need create() here in fill ever...
			arr.fill(value, start, start + prev.length);
		} else if (op == 'length') {
			let [, len] = change;
			arr.length = len;
		}
	}
}

class PropertyUndoRedo {
	static undo(obj, change) {
		let [op, key, , prevValue] = change;
		if (op == 'delete') {
			obj[key] = prevValue;
		} else if (op == 'set') {
			obj[key] = prevValue;
		}
	}

	static redo(obj, change) {
		let [op, key, newValue] = change;
		if (op == 'delete') {
			delete obj[key];
		} else if (op == 'set') {
			obj[key] = newValue;
		}
	}
}

export { ArrayUndoRedo, PropertyUndoRedo };
