import { extend } from './utils.js';
import { path } from './observer.js';
import {ArrayUndoRedo, PropertyUndoRedo} from './undo-redo.js';

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

		let keys = pth.split('/');
		if (pth.charAt(0) == '/') keys.shift();
		let prop = propOp ? keys.pop() : undefined;
		let obj = target;
		for (let key of keys.values()) {
			obj = obj[key];
		}
		let args = Array.prototype.slice.call(change, 1);
		if (propOp) {
			args.unshift(prop);
		} else if (args[0] == 'splice') {
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
	let key = args[0];
	let op = args[1];

	let propOp = op == 'set' || op == 'delete';
	let pth = path(target, propOp ? key : undefined);
	if (!filter || filter(pth)) {
		// we do not need key in args anymore
		if (propOp) args.shift();
		// we need to clone possible array-trap deleted/inserted arrays
		args = extend(args);
		return [pth, ...args];
	}
	return [];
}

class ObserverHistory {
	constructor({ root, filter, max = 10, repetitiveDelay = 1000, createObject } = {}) {
		this.root = root;
		this.max = max;
		// squash repetitive commits if they come in less than repetitiveDelay ms
		// typical case is - numeric input with arrow button clicking, or range input slider dragging
		// our text editor, Quill, uses same delay for its history
		this.repetitiveDelay = repetitiveDelay;
		this.createObject = createObject;
		this.resetHistory();
		this.changes = [];
		this.recording = false;

		if (filter) {
			if (typeof filter == 'function') {
				this.filter = filter.bind(this);
			} else {
				if (!Array.isArray(filter)) filter = [filter];
				this.filter = function (pth) {
					return filter.some((subpath) => pth.indexOf(subpath) === 0);
				};
			}
		} else {
			this.filter = function () {
				return true;
			};
		}
	}

	set(serialized = {}) {
		this.changes = serialized.changes || [];
		this.pos = 'pos' in serialized ? serialized.pos : -1;
		this.stack = serialized.stack || [];
	}

	serialize() {
		return {
			changes: [...this.changes],
			pos: this.pos,
			stack: [...this.stack],
		};
	}

	onchange(root, target, ...args) {
		if (!this.recording || root != this.root) return;
		let change = getChange(this.filter, target, ...args);
		if (change.length) this.changes.push(change);
	}

	pause() {
		this.recording = false;
		this.resetChanges();
	}

	endure() {
		this.recording = true;
		this.resetChanges();
	}

	resetChanges() {
		this.changes.length = 0;
	}

	resetHistory() {
		this.pos = -1;
		this.stack = [];
	}

	undo() {
		if (this.pos < 0) return;
		let data = this.stack[this.pos];
		this.pos -= 1;
		this.play('undo', data.changes);
		return data;
	}

	redo() {
		if (this.pos == this.stack.length - 1) return;
		this.pos += 1;
		if (this.changes.length) {
			// there is uncommited changes, we can't go forward
			return;
		}
		let data = this.stack[this.pos];
		this.play('redo', data.changes);
		return data;
	}

	status() {
		let status = {
			changes: this.changes,
			stack: this.stack,
			pos: this.pos,
		};
		if (~this.pos) {
			// we can undo
			status.undo = this.stack[this.pos].description;
		}
		if (this.stack.length - this.pos > 1 && !this.changes.length) {
			// we can redo only if we do not have uncommitted changes
			status.redo = this.stack[this.pos + 1].description;
		}
		return status;
	}

	commit(description = '', meta = true) {
		if (!this.changes.length) return;

		// committed changes are always pushed to top
		// after successful commit this.pos is always +1, except when it is repetitive, then it is the same
		if (this.pos < this.stack.length - 1) {
			// we have being undoing
			this.stack.length = this.pos + 1;
			//this.stack.splice(this.pos + 1, this.stack.length);
		}

		// do not save repetitive events, just the last one
		// only add to stack if different
		let top = this.stack.slice(-1)[0];

		// detect by description and meta only, NOT by change record
		if (top && top.description == description && JSON.stringify(top.meta) == JSON.stringify(meta)) {
			// repetitive change
			if (+new Date() - this.lastCommit < this.repetitiveDelay) {
				// remove last
				this.stack.pop();
			}
		}
		this.stack.push({
			changes: Array.from(this.changes),
			meta,
			description,
		});
		this.lastCommit = +new Date();
		this.resetChanges();
		if (this.stack.length > this.max) this.stack.shift();
		this.pos = this.stack.length - 1;
		return this.stack[this.pos];
	}

	play(method, changes) {
		this.pause();
		applyChanges(this.root, method, changes, this.createObject);
		this.endure();
	}

	mixin(target, map = {}) {
		for (let [key, val] of Object.entries({
			set: 'setHistory',
			serialize: 'serializeHistory',
			pause: 0,
			endure: 0,
			undo: 0,
			redo: 0,
			status: 'historyStatus',
			commit: 'commitChanges',
			...map,
		})) {
			Object.defineProperty(target, val ? val : key, {
				value: function (...args) {
					return this[key](...args);
				}.bind(this),
			});
		}
	}
}

export { ObserverHistory, applyChanges, getChange };
