
# Object Observer

Observing and validation Proxy for Objects and Arrays.

## Why?

Creating Proxy is easy, but the result is hardly useful out of the box.


Object Observer has:

1) Nesting suppport, nested objects are automatically proxified

2) Array support, array changes are detected as one transform, not like sequence of property changes

3) Path support, changes in nested objects are meaningful in root object context

4) undo/redo/snapshot support, all recorded changes can be applied back and forth


## Example

		import { path, createObserver } from './observer.js';

		function stringify(val) {
			return typeof val == 'object' && val ? JSON.stringify(val) : val;
		}

		function createSimpleProxy(obj) {
			return new Proxy(obj, {
				set(target, prop, val, receiver) {
					try {
						return Reflect.set(target, prop, val, receiver);
					} finally {
						console.log(`changed '${prop}' to '${stringify(val)}'`);
					}
				},
			});
		}

		function createProxy(obj) {
			return createObserver(obj, function (target, ...args) {
				if (Array.isArray(target)) {
					let func = args.shift();
					let desc = args.map((a) => stringify(a)).join(',');
					console.log(`${func}: ${desc}`);
				} else {
					let prop = path(target, args[0]);
					console.log(`${args[1]} '${prop}' to '${stringify(args[2])}'`);
				}
			});
		}

		// Objects
		let simple = createSimpleProxy({ name: 'John' });
		let observer = createProxy({ name: 'John' });

		simple.name = 'Pete'; // changed "name" to "Pete"
		observer.name = 'Pete'; // set 'name' to 'Pete'

		simple.data = { address: 'Silicon Valley' }; // changed 'data' to '{"address":"Silicon Valley"}'
		// no change detected
		simple.data.address = 'New York'; //

		observer.data = { address: 'Silicon Valley' }; // set 'data' to '{"address":"Silicon Valley"}'
		// change is detected with path
		observer.data.address = 'New York'; // set 'data/address' to 'New York'

		// no additional properties to mess up the "pure" Object
		console.log(Object.keys(observer)); // ["name", "data"]

		// Arrays
		let simpleArray = createSimpleProxy([1, 2, 3]);
		simpleArray.shift();
		// outputs:
		// [2, 2, 3] "changed '0' to '2'"
		// [2, 3, 3] "changed '1' to '3'"
		// [2, 3] "changed 'length' to '2'"

		let array = createProxy([1, 2, 3]);
		array.shift(); // splice: 0,[1],[]
		// meaning spliced at index 0, removed [1] and inserted nothing, every array mutation description has specific arguments



