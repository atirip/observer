import { expect } from 'chai';
import { createObserver as createObservable, path, retrieve, nameSymbol } from '../observer.js';
import { extend } from '../utils.js';

describe('Object Observer', function () {
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

	it('extend should work', function () {
		// if extend fails, we can't continue
		expect(source).to.be.deep.equal(extend(source));
	});

	it('create observable', function () {
		expect(createObservable({})).to.be.a('object');
		expect(createObservable(extend(source))).to.be.deep.equal(source);
	});

	it('validation', function () {
		let o = createObservable(
			{
				boolean: true,
				string: 'data',
				number: 231321,
			},
			undefined,
			function (target, op, key, valueRef, prev) {
				if (key == 'boolean') {
					// allow all changes
					return true;
				}
				if (key == 'string') {
					// prevent any changes
					return false;
				}
				if (key == 'number') {
					// prevent any change and force the value to 1
					valueRef.value = 1;
					return true;
				}
			}
		);

		expect((o.boolean = false)).to.be.false; // <- this works

		// this does not work, IF we prevent change, is it a Proxy feature or what? -> expect(o.number = 200).to.equal(1)
		o.number = 200;
		expect(o.number).to.equal(1);

		try {
			o.string = 'foo';
		} catch (e) {
			// if we prevent change, it throws
		}
		expect(o.string).to.equal('data');
	});

	it('detect changes', function () {
		createObservable(extend(source), function (target, op, key, value, prev, receiver) {
			expect(key).to.equal('boolean');
			expect(value).to.equal(false);
			expect(prev).to.equal(true);
			expect(path(target, key)).to.equal('boolean');
		}).boolean = false;

		let obj = extend(source);
		createObservable(obj, function (target, op, key, value, prev, receiver) {
			expect(key).to.equal('id');
			expect(value).to.equal('blaah');
			expect(prev).to.equal(source.array[4].id);
			expect(path(target, key)).to.equal('array/4/id');
		}).array[4].id = 'blaah';
	});

	it('redefine arrays object names', function () {
		let obj = extend(source);
		let o = createObservable(obj);
		o.array.shift();
		expect(o.array[3][nameSymbol]).to.equal('3');
	});

	it('create paths acces property by path', function () {
		let p = createObservable(extend(source), undefined, function () {
			return true;
		});
		expect(path(p.array[4])).to.equal('array/4');
		expect(retrieve(p, 'array/4')).to.deep.equal(source.array[4]);

		expect(path(p.array[4], 'id')).to.equal('array/4/id');
		expect(retrieve(p, 'array/4/id')).to.equal(source.array[4].id);

		p = createObservable(
			extend(source),
			undefined,
			function () {
				return true;
			},
			'obj'
		);
		expect(path(p.array[4])).to.equal('obj/array/4');
		expect(retrieve(p, 'obj/array/4')).to.deep.equal(source.array[4]);

		expect(path(p.array[4], 'id')).to.equal('obj/array/4/id');
		expect(retrieve(p, 'obj/array/4/id')).to.equal(source.array[4].id);
	});

	it('guard against cyclical references', function () {
		let a = {};
		let b = {};
		a.b = b;
		b.a = a;
		let o = createObservable(a);
		o.c = b;
	});
});
