import { expect } from 'chai';
import { patch } from '../patch.js';
import { extend } from '../utils.js';
import { createObserver } from '../observer.js';

let source = {
	string: 'data',
	number: 231321,
	object: {
		string: 'data',
		number: 32434,
	},
	array: [
		1,
		2,
		3,
		4,
		{
			id: 'baz',
			foo: 'blaah',
		},
	],
};

describe('Patch', function () {
	it('should patch the target', function () {
		//expect(patch(2, 3)).to.be.deep.equal(3);

		let orig = [1, 2, 3];
		let res = !!patch(orig, [0, 2, 3, 5]);
		expect(orig).to.be.deep.equal([0, 2, 3, 5]);
		expect(res).to.be.true;

		let orig2 = {
			a: 1,
			b: 1,
			d: [1, 2, 3],
		};

		let res2 = !!patch(orig2, {
			a: 2,
			c: 1,
			d: [0, 2, 3, 5],
		});

		expect(orig2).to.be.deep.equal({
			a: 2,
			c: 1,
			d: [0, 2, 3, 5],
		});

		expect(res2).to.be.true;
	});

	it('should patch the proxy', function () {
		let o = createObserver(extend(source), { onchange: function () {} });
	});
});
