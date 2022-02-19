import { expect } from 'chai';
import { createObserver } from '../observer.js';
import { extend } from '../utils.js';
import { ObserverSnapshot } from '../observer-snapshot.js';

let max = 2;

function createSnapshotObserver(obj) {
	let history;
	let observable = createObserver(obj, {
		onchange: function (...args) {
			history.onchange(observable, ...args);
		},
	});
	history = new ObserverSnapshot({ root: observable, max: max });
	history.endure();
	history.mixin(observable);
	return observable;
}

describe('Snapshot Oberver', function () {
	//PS! this is more like a development helper, there are assumptions that stuff elsewhere works as expected
	// the sole purpose is it to be as module test and continue to safely developing other stuff that depends on this and
	// not break it while adjusting

	let source = {
		boolean: true,
		string: 'data',
		number: 231321,
		object: {
			string: 'data',
			number: 32434,
		},
		array: [1, 2, 3, 4],
	};

	it('create snapshots', function () {
		let o = createSnapshotObserver(extend(source));
		let initial = extend(o);
		let r;

		r = o.takeSnapshot();
		expect(!!r).to.be.deep.equal(true);
		r = o.takeSnapshot();
		expect(!!r).to.be.deep.equal(false);

		o.string = 'hello1';
		o.string = 'hello2';
		o.string = 'hello3';
		o.string = 'hello4';

		r = o.restoreFromSnapshot();

		expect(o).to.be.deep.equal(initial);

		r = o.takeSnapshot();
		o.string = 'hello1';
		o.commitChanges('1');
		o.string = 'hello2';
		o.commitChanges('2');
		o.string = 'hello3';
		o.commitChanges('3');
		o.string = 'hello4';
		o.commitChanges('4');

		r = o.restoreFromSnapshot();

		let s = o.historyStatus();
		expect(s.pos).to.be.deep.equal(-1);
		expect(s.stack.length).to.be.deep.equal(0);
		expect(s.changes.length).to.be.deep.equal(0);
		expect(o).to.be.deep.equal(initial);

		r = o.takeSnapshot();
		o.string = 'hello1';
		o.commitChanges('1');
		o.string = 'hello2';
		o.commitChanges('2');
		o.string = 'hello3';
		o.commitChanges('3');
		o.string = 'hello4';
		o.commitChanges('4');

		r = o.releaseSnapshot();
		expect(!!r).to.be.deep.equal(true);

		s = o.historyStatus();
		expect(s.pos).to.be.deep.equal(max - 1);
		expect(s.stack.length).to.be.deep.equal(max);
		expect(s.changes.length).to.be.deep.equal(0);
	});
});
