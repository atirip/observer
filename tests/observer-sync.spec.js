
import { expect } from 'chai';
import { createObserver as createObservable } from '../observer.js';
import { applyChanges, getChange } from '../observer-history.js';

describe('Object Sync', function () {
	// this is specific test file to test the reliability of object observer and history.
	// The approach here is to create proxy from object A and B, using clones of the same
	// source object. Then listen all the changes from A by B and change B with these events
	// and change records to keep B deep equal with A all the time. The objective is to compare
	// only the source objects (not the proxies) and to assure that both remain Transferable
	// The challenge is to change A so, that B will be out of sync. If we can't - success!

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

	it('syncing', async function () {
		var aObj = {};
		var bObj = {};

		function createProxy(obj, onchange) {
			return createObservable(obj, function (...args) {
				let change = getChange(false, ...args);
				if (change.length) onchange(change);
			});
		}

		var aProxy = createProxy(aObj, function (change) {
			applyChanges(bProxy, 'redo', change);
		});

		var bProxy = createProxy(bObj, function (change) {
			expect(bObj).to.be.deep.equal(aObj);
		});

		Object.assign(aProxy, source);

		aProxy.boolean = null;
		aProxy.foo = 'blaah';
		delete aProxy.foo;
		aProxy.array.unshift(7);

		aProxy.array.unshift(7);
		aProxy.array.reverse();
		aProxy.array.sort();

		aProxy.array.pop();
		aProxy.array.push(9);

		aProxy.array.unshift(7);

		aProxy.array.length = 3;

		aProxy.array = [];
	});
});
