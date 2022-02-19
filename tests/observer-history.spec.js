import { expect } from 'chai';
import { createObserver } from '../observer.js';
import { extend } from '../utils.js';
import { ObserverHistory } from '../observer-history.js';

function createObjectWithHistory(obj) {
	let history;
	let observable = createObserver(obj, {
		onchange: function (...args) {
			history.onchange(observable, ...args);
		},
	});
	history = new ObserverHistory({ root: observable, repetitiveDelay: 100 });
	history.endure();
	history.mixin(observable);
	return observable;
}

describe('Object History', function () {
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

	it('extend should work', function () {
		// if extend fails, we can't continue
		expect(source).to.be.deep.equal(extend(source));
	});

	it('create observable', function () {
		expect(createObserver({})).to.be.a('object');
		expect(createObserver(extend(source))).to.be.deep.equal(source);
	});

	it('change/undo/redo', function () {
		let o = createObjectWithHistory(source);

		let initial = extend(o);

		o.string = 'ello';
		o.array.push({
			id: 'baz',
			foo: 'blaah',
		});
		o.array[4].foo = 'ello!';

		let changed = extend(o);

		o.commitChanges('test');

		o.undo();
		expect(extend(o)).to.be.deep.equal(initial);

		o.redo();
		expect(extend(o)).to.be.deep.equal(changed);
	});

	it('repetitive changes', async function () {
		let o = createObjectWithHistory(extend(source));

		//let initial = extend(o);

		o.string = 'hello';
		o.commitChanges('test');

		o.string = 'hello1';
		o.commitChanges('test');

		expect(o.historyStatus().stack.length).to.be.deep.equal(1);

		await new Promise((resolve) => setTimeout(resolve, 150));

		o.string = 'hello2';
		o.commitChanges('test');

		expect(o.historyStatus().stack.length).to.be.deep.equal(2);

		o.commitChanges('test');

		expect(o.historyStatus().stack.length).to.be.deep.equal(2);
	});
});
