import { createObserver } from './observer.js';
import { applyChanges, getChange } from './change.js';

class ObserverHistory {
	constructor({ root, filter, max = 10, repetitiveDelay = 1000, createObject } = {}) {
		this.root = root;
		this.max = max;
		// squash repetitive commits if they come in less than repetitiveDelay ms
		// typical case is - numeric input with arrow button clicking, or range input slider dragging
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

function createInstance(cnstrctr, source, options = {}) {
	let history;
	let proxy;
	function onchange (...args) {
		if (options.onchange) {
			options.onchange(...args);
		}
		history.onchange(proxy, ...args);
	}
	proxy = createObserver(source, {
		onchange
	});
	history = new cnstrctr(Object.assign({ root: proxy}, options));
	history.endure();
	history.mixin(proxy);
	return proxy;
}

function createHistoryObserver(...args) {
	return createInstance(ObserverHistory, ...args);
}

export { createHistoryObserver, createInstance, ObserverHistory };
