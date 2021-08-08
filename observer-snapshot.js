/*
		one snapshot only and it is not intended to be saveable, the usage case for snapshot is a'la SQL transaction
		
		start transaction - takeSnapshot
		rollback - restoreFromSnapshot
		commit - releaseSnapshot
		
	
	*/

import { ObserverHistory } from './observer-history.js';

const max = 1000;

class ObserverSnapshot extends ObserverHistory {
	takeSnapshot() {
		if (this.snapshot) return;
		this.snapshot = {
			pos: this.pos,
			max: this.max,
		};
		this.max = max;
		return true;
	}

	set(serialized = {}) {
		super.set(serialized);
		this.snapshot = serialized.snapshot;
		if (this.snapshot) this.max = max;
	}

	serialize() {
		let ser = super.serialize();
		if (this.snapshot) {
			ser.snapshot = this.snapshot;
		}
		return ser;
	}

	releaseSnapshot() {
		if (!this.snapshot) return;
		this.max = this.snapshot.max;
		if (this.stack.length > this.max) {
			let toDelete = this.stack.length - this.max;
			this.stack.splice(0, toDelete);
			this.pos -= toDelete;
		}
		this.snapshot = undefined;
		return true;
	}

	restoreFromSnapshot() {
		if (!this.snapshot) return;
		this.commit('snapshot');
		let restored = this.snapshot.pos < this.pos;
		while (this.snapshot.pos < this.pos) {
			super.undo();
		}
		this.max = this.snapshot.max;
		if (this.stack.length > this.pos) {
			this.stack.length = this.pos + 1;
		}
		this.snapshot = undefined;
		return restored;
	}

	mixin(target, map = {}) {
		super.mixin(target, {
			takeSnapshot: 0,
			releaseSnapshot: 0,
			restoreFromSnapshot: 0,
			...map,
		});
	}
}

export { ObserverSnapshot };
