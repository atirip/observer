
import { expect } from 'chai';
import { validateProperty, validateArrayMutation } from '../extra/estonian-notation.js';

describe('Estonian Notation', function () {
	let valueRef = {};
	function testSet(key, newVal, res) {
		let ok = validateProperty(key, 'set', valueRef);
		expect(ok).to.deep.equal(res);
		expect(valueRef.value).to.deep.equal(newVal);
	}

	function testDelete(key, newVal, res) {
		let ok = validateProperty(key, 'delete', valueRef);
		expect(ok).to.deep.equal(res);
		expect(valueRef.value).to.deep.equal(newVal);
	}

	it('not validate', function () {
		expect(validateProperty('foo', 'set', valueRef)).to.be.true;
		expect(validateProperty('_foo', 'set', valueRef)).to.be.true;
		expect(validateProperty('x_foo', 'set', valueRef)).to.be.true;
	});

	it('validate boolean', function () {
		// casted
		valueRef.value = undefined;
		testSet('b_', false, true);

		valueRef.value = null;
		testSet('b_', false, true);

		valueRef.value = true;
		testSet('b_', true, true);

		valueRef.value = false;
		testSet('b_', false, true);

		valueRef.value = 'foo';
		testSet('b_', true, true);

		valueRef.value = 0;
		testSet('b_', false, true);

		valueRef.value = Infinity;
		testSet('b_', true, true);

		valueRef.value = NaN;
		testSet('b_', false, true);

		// strict
		valueRef.value = undefined;
		testSet('bt_', valueRef.value, false);

		valueRef.value = null;
		testSet('bt_', valueRef.value, false);

		valueRef.value = true;
		testSet('bt_', true, true);

		valueRef.value = false;
		testSet('bt_', false, true);

		valueRef.value = 'foo';
		testSet('bt_', valueRef.value, false);

		valueRef.value = 0;
		testSet('bt_', valueRef.value, false);

		valueRef.value = Infinity;
		testSet('bt_', valueRef.value, false);

		valueRef.value = NaN;
		testSet('bt_', valueRef.value, false);

		// delete
		testDelete('b_', undefined, true);
		testDelete('br_', false, true);
	});

	it('validate array', function () {
		valueRef.value = undefined;
		testSet('a_', valueRef.value, false);
		valueRef.value = null;
		testSet('a_', valueRef.value, false);
		valueRef.value = 2;
		testSet('a_', valueRef.value, false);
		valueRef.value = 0;
		testSet('a_', valueRef.value, false);
		valueRef.value = '';
		testSet('a_', valueRef.value, false);
		valueRef.value = '1';
		testSet('a_', valueRef.value, false);
		valueRef.value = false;
		testSet('a_', valueRef.value, false);
		valueRef.value = true;
		testSet('a_', valueRef.value, false);
		valueRef.value = {};
		testSet('a_', valueRef.value, false);
		valueRef.value = Infinity;
		testSet('a_', valueRef.value, false);
		valueRef.value = NaN;
		testSet('a_', valueRef.value, false);

		let arr = [1, 2, 3];
		valueRef.value = new Set(arr);
		testSet('a_', arr, true);

		valueRef.value = arr;
		testSet('a_', arr, true);

		//strict
		valueRef.value = new Set(arr);
		testSet('at_', valueRef.value, false);

		valueRef.value = arr;
		testSet('a_', arr, true);

		//delete
		testDelete('a_', undefined, true);
		testDelete('ar_', [], true);
	});

	it('validate object', function () {
		valueRef.value = undefined;
		testSet('o_', valueRef.value, false);
		valueRef.value = 2;
		testSet('o_', valueRef.value, false);
		valueRef.value = 0;
		testSet('o_', valueRef.value, false);
		valueRef.value = '';
		testSet('o_', valueRef.value, false);
		valueRef.value = '1';
		testSet('o_', valueRef.value, false);
		valueRef.value = false;
		testSet('o_', valueRef.value, false);
		valueRef.value = true;
		testSet('o_', valueRef.value, false);
		valueRef.value = [];
		testSet('o_', valueRef.value, false);

		let obj = { 1: 1, 2: 2, 3: 3 };

		valueRef.value = obj;
		testSet('o_', obj, true);
		valueRef.value = null;
		testSet('o_', null, true);

		testDelete('o_', undefined, true);
		testDelete('or_', {}, true);
	});

	it('validate number', function () {
		// cast
		valueRef.value = undefined;
		testSet('n_', NaN, true);
		valueRef.value = '';
		testSet('n_', 0, true);
		valueRef.value = '1';
		testSet('n_', 1, true);
		valueRef.value = false;
		testSet('n_', 0, true);
		valueRef.value = true;
		testSet('n_', 1, true);
		valueRef.value = [];
		testSet('n_', NaN, true);
		valueRef.value = {};
		testSet('n_', NaN, true);
		valueRef.value = Infinity;
		testSet('n_', Infinity, true);
		valueRef.value = NaN;
		testSet('n_', NaN, true);
		valueRef.value = 2;
		testSet('n_', valueRef.value, true);
		valueRef.value = 0;
		testSet('n_', valueRef.value, true);

		//typed
		valueRef.value = undefined;
		testSet('nt_', valueRef.value, false);
		valueRef.value = '';
		testSet('nt_', valueRef.value, false);
		valueRef.value = '1';
		testSet('nt_', valueRef.value, false);
		valueRef.value = false;
		testSet('nt_', valueRef.value, false);
		valueRef.value = true;
		testSet('nt_', valueRef.value, false);
		valueRef.value = [];
		testSet('nt_', valueRef.value, false);
		valueRef.value = {};
		testSet('nt_', valueRef.value, false);
		valueRef.value = Infinity;
		testSet('nt_', valueRef.value, true);
		valueRef.value = NaN;
		testSet('nt_', valueRef.value, true);

		valueRef.value = 2;
		testSet('nt_', valueRef.value, true);
		valueRef.value = 0;
		testSet('nt_', valueRef.value, true);

		//casted and zeroed
		valueRef.value = undefined;
		testSet('nz_', 0, true);
		valueRef.value = '';
		testSet('nz_', 0, true);
		valueRef.value = '1';
		testSet('nz_', 1, true);
		valueRef.value = false;
		testSet('nz_', 0, true);
		valueRef.value = true;
		testSet('nz_', 1, true);
		valueRef.value = [];
		testSet('nz_', 0, true);
		valueRef.value = {};
		testSet('nz_', 0, true);
		valueRef.value = Infinity;
		testSet('nz_', Infinity, true);
		valueRef.value = NaN;
		testSet('nz_', 0, true);
		valueRef.value = 2;
		testSet('nz_', valueRef.value, true);
		valueRef.value = 0;
		testSet('nz_', valueRef.value, true);

		testDelete('n_', undefined, true);
		testDelete('nr_', 0, true);
		testDelete('nrzt_', 0, true);
	});

	it('validate integer', function () {
		// cast
		valueRef.value = undefined;
		testSet('i_', NaN, true);
		valueRef.value = '';
		testSet('i_', NaN, true);
		valueRef.value = '1';
		testSet('i_', 1, true);
		valueRef.value = false;
		testSet('i_', NaN, true);
		valueRef.value = true;
		testSet('i_', NaN, true);
		valueRef.value = [];
		testSet('i_', NaN, true);
		valueRef.value = {};
		testSet('i_', NaN, true);
		valueRef.value = Infinity;
		testSet('i_', NaN, true);
		valueRef.value = NaN;
		testSet('i_', NaN, true);
		valueRef.value = 2;
		testSet('i_', valueRef.value, true);
		valueRef.value = 0;
		testSet('i_', valueRef.value, true);
	});

	it('validate string', function () {
		// cast
		valueRef.value = undefined;
		testSet('s_', '', true);
		valueRef.value = '';
		testSet('s_', '', true);
		valueRef.value = '1';
		testSet('s_', '1', true);
		valueRef.value = false;
		testSet('s_', 'false', true);
		valueRef.value = true;
		testSet('s_', 'true', true);
		valueRef.value = [];
		testSet('s_', valueRef.value, false);
		valueRef.value = {};
		testSet('s_', valueRef.value, false);
		valueRef.value = Infinity;
		testSet('s_', 'Infinity', true);
		valueRef.value = NaN;
		testSet('s_', 'NaN', true);
		valueRef.value = 2;
		testSet('s_', '2', true);
		valueRef.value = 0;
		testSet('s_', '0', true);

		//typed
		valueRef.value = undefined;
		testSet('st_', valueRef.value, false);
		valueRef.value = '';
		testSet('st_', valueRef.value, true);
		valueRef.value = '1';
		testSet('st_', valueRef.value, true);
		valueRef.value = false;
		testSet('st_', valueRef.value, false);
		valueRef.value = true;
		testSet('st_', valueRef.value, false);
		valueRef.value = [];
		testSet('st_', valueRef.value, false);
		valueRef.value = {};
		testSet('st_', valueRef.value, false);
		valueRef.value = Infinity;
		testSet('st_', valueRef.value, false);
		valueRef.value = NaN;
		testSet('st_', valueRef.value, false);
		valueRef.value = 0;
		testSet('st_', valueRef.value, false);

		testDelete('s_', undefined, true);
		testDelete('sr_', '', true);
	});

	it('validate array push', function () {
		let ok;
		let args;

		args = [true, false, 1, 2];
		ok = validateArrayMutation('a_b_', 'push', args);
		expect(ok).to.deep.equal(true);
		expect(args).to.deep.equal([true, false, true, true]);
	});
});
