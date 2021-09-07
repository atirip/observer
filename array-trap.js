/*
		This module traps array function calls and legth direct access and produces change record that is undoable and redoable


		import {ArrayTrap} from './array-trap.js';
		import {ArrayUndoRedo} from './undo-redo.js';		

		let p = new ArrayTrap();
		let a = [];

		p.push(a, 1, 2, 3, 4, 5, 6, 7);
		expect(a).to.deep.equal([1, 2, 3, 4, 5, 6, 7]);

		ArrayUndoRedo.undo(a, p.change);
		expect(a).to.deep.equal([]);

		ArrayUndoRedo.redo(a, p.change);
		expect(a).to.deep.equal([1, 2, 3, 4, 5, 6, 7]);
		
		optional create argument for undo/redo is to create specific object from standard Object that JSON.parse() will return
	
	*/

function splice(arr, ...args) {
	return arr.splice(...args);
}

export class ArrayTrap {
	constructor() {
		this.change = [];
	}

	get functions() {
		return ['splice', 'sort', 'reverse', 'copyWithin', 'pop', 'push', 'unshift', 'shift', 'length', 'fill'];
	}

	splice(arr, start, deleteCount, ...inserted) {
		this.change.length = 0;

		// we need to nail start down as in spec
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
		start = +start;
		if (isNaN(start)) return;
		start = Math.min(start, arr.length);
		if (start < 0) start = Math.max(arr.length + start, 0);

		let deleted = splice(arr, start, deleteCount, ...inserted);
		if (deleted.length || inserted.length) {
			// if deleted or inserted has objects, they are by reference, need to clone later if desire to preserve
			this.change = ['splice', start, deleted || [], inserted || []];
		}
		return deleted;
	}

	sort(arr, compareFunction) {
		this.change.length = 0;
		let copy = Array.from(arr);
		arr.sort(compareFunction);
		let map = [];
		for (let [index, elem] of arr.entries()) {
			let prevIndex = copy.indexOf(elem);
			if (index != prevIndex) map.push([index, prevIndex]);
		}
		if (map.length) {
			this.change = ['sort', map];
		}
		return arr;
	}

	reverse(arr) {
		arr.reverse();
		this.change = ['reverse'];
		return arr;
	}

	copyWithin(arr, target, start, end) {
		this.change.length = 0;
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/copyWithin
		// here the important part is to get all parameters correct

		let len = arr.length;
		//Zero-based index at which to copy the sequence to.
		target = +target;
		if (isNaN(target) || target >= len) return;
		if (target < 0) target = Math.max(len + target, 0);

		//Zero-based index at which to start copying elements from.
		start = +start || 0;
		if (start < 0) start = Math.max(len + start, 0);

		//Zero-based index at which to end copying elements from.
		end = +end;
		if (isNaN(end)) end = len;
		end = end < 0 ? Math.max(arr.length + end, 0) : Math.min(end, len);

		if (target > start) end -= target - start - 1;

		let copied = arr.slice(target, target + end - start);
		if (copied.length) {
			this.change = ['copyWithin', target, start, copied];
			//return Array.prototype.copyWithin.call(arr, target, start, end);
			return arr.copyWithin(target, start, end);
		}
		return arr;
	}

	fill(arr, value, start, end) {
		let len = arr.length;
		start = start >> 0;
		start = start < 0 ? Math.max(len + start, 0) : Math.min(start, len);
		end = end === undefined ? len : end >> 0;
		end = end < 0 ? Math.max(len + end, 0) : Math.min(end, len);

		let filled = arr.slice(start, end);
		if (filled.length) {
			this.change = ['fill', value, start, filled];
			return arr.fill(value, start, end);
		}
		return arr;
	}

	length(arr, len) {
		this.change.length = 0;
		if (len == arr.length) return;
		let prev;
		if (len < arr.length) {
			prev = arr.slice(len);
		} else if (len > arr.length) {
			prev = arr.length;
		}
		arr.length = len;
		this.change = ['length', len, prev];
		return true;
	}

	pop(arr) {
		return this.splice(arr, -1, 1)[0];
	}

	push(arr, ...args) {
		return this.splice(arr, arr.length, 0, ...args);
	}

	shift(arr) {
		return this.splice(arr, 0, 1)[0];
	}

	unshift(arr, ...args) {
		return this.splice(arr, 0, 0, ...args);
	}
}
