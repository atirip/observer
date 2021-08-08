//USAGE: ../../node_modules/mocha/bin/mocha array-trap.spec.js

import { expect } from 'chai';
import {ArrayTrap} from '../array-trap.js';
import {ArrayUndoRedo} from '../undo-redo.js';


describe('Array Trap', function () {


	it('push', function () {
		let p = new ArrayTrap();
		let a = [];

		p.push(a, 1, 2, 3, 4, 5, 6, 7);
		expect(a).to.deep.equal([1, 2, 3, 4, 5, 6, 7]);

		ArrayUndoRedo.undo(a, p.change);
		expect(a).to.deep.equal([]);

		ArrayUndoRedo.redo(a, p.change);
		expect(a).to.deep.equal([1, 2, 3, 4, 5, 6, 7]);
	});

	it('shift', function () {
		let p = new ArrayTrap();
		let a = [1, 2, 3, 4, 5, 6, 7];
		p.unshift(a, 8, 9);
		expect(a).to.deep.equal([8, 9, 1, 2, 3, 4, 5, 6, 7]);

		ArrayUndoRedo.undo(a, p.change);
		expect(a).to.deep.equal([1, 2, 3, 4, 5, 6, 7]);

		ArrayUndoRedo.redo(a, p.change);
		expect(a).to.deep.equal([8, 9, 1, 2, 3, 4, 5, 6, 7]);
	});

	it('copyWithin implementation', function () {
		let p = new ArrayTrap();
		expect([1, 2, 3, 4, 5].copyWithin(-2)).to.deep.equal(p.copyWithin([1, 2, 3, 4, 5], -2));
		expect([1, 2, 3, 4, 5].copyWithin(0, 3)).to.deep.equal(p.copyWithin([1, 2, 3, 4, 5], 0, 3));
		expect([1, 2, 3, 4, 5].copyWithin(0, 3, 4)).to.deep.equal(p.copyWithin([1, 2, 3, 4, 5], 0, 3, 4));
		expect([1, 2, 3, 4, 5].copyWithin(-2, -3, -1)).to.deep.equal(p.copyWithin([1, 2, 3, 4, 5], -2, -3, -1));
		expect([1, 2, 3, 4, 5].copyWithin(0, 3, 4)).to.deep.equal(p.copyWithin([1, 2, 3, 4, 5], 0, 3, 4));
	});

	it('copyWithin', function () {
		let p = new ArrayTrap();
		let a = [1, 2, 3, 4, 5, 6, 7];

		p.copyWithin(a, 0, 3, 4);
		expect(a).to.deep.equal([4, 2, 3, 4, 5, 6, 7]);

		ArrayUndoRedo.undo(a, p.change);
		expect(a).to.deep.equal([1, 2, 3, 4, 5, 6, 7]);
		ArrayUndoRedo.redo(a, p.change);
		expect(a).to.deep.equal([4, 2, 3, 4, 5, 6, 7]);
	});

	it('fill', function () {
		let p = new ArrayTrap();
		let a = [1, 2, 3, 4, 5, 6, 7];

		p.fill(a, 0, 3, 4);
		expect(a).to.deep.equal([1, 2, 3, 0, 5, 6, 7]);

		ArrayUndoRedo.undo(a, p.change);
		expect(a).to.deep.equal([1, 2, 3, 4, 5, 6, 7]);
		ArrayUndoRedo.redo(a, p.change);
		expect(a).to.deep.equal([1, 2, 3, 0, 5, 6, 7]);
	});

	it('sort', function () {
		let p = new ArrayTrap();
		let a = [1, 7, 6, 5, 4, 3, 2];

		p.sort(a);
		expect(a).to.deep.equal([1, 2, 3, 4, 5, 6, 7]);

		ArrayUndoRedo.undo(a, p.change);
		expect(a).to.deep.equal([1, 7, 6, 5, 4, 3, 2]);
		ArrayUndoRedo.redo(a, p.change);
		expect(a).to.deep.equal([1, 2, 3, 4, 5, 6, 7]);
	});

	it('length', function () {
		let p = new ArrayTrap();
		let a = [1, 7, 6, 5, 4, 3, 2];

		p.length(a, 3);
		expect(a).to.deep.equal([1, 7, 6]);

		ArrayUndoRedo.undo(a, p.change);
		expect(a).to.deep.equal([1, 7, 6, 5, 4, 3, 2]);
		ArrayUndoRedo.redo(a, p.change);
		expect(a).to.deep.equal([1, 7, 6]);

		a = [1, 7, 6];

		p.length(a, 5);
		expect(a).to.deep.equal([1, 7, 6, undefined, undefined]);

		ArrayUndoRedo.undo(a, p.change);
		expect(a).to.deep.equal([1, 7, 6]);
		ArrayUndoRedo.redo(a, p.change);
		expect(a).to.deep.equal([1, 7, 6, undefined, undefined]);
	});
});
