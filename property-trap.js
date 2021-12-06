/*
		This is counterpart to ArrayTrap to unify undo/redo calls, it produces the same kind of a change that is  is undoabele and redoable


		import {PropertyTrap} from './property-trap.js';
		import {PropertyUndoRedo} from './undo-redo.js';	
		
		let p = new PropertyTrap();
		let o = {a: 1}
		
		p.setProperty(o, 'a', 2);
		expect(a).to.deep.equal({a: 2});

		PropertyUndoRedo.undo(a, p.change);
		expect(a).to.deep.equal({a: 1});

		PropertyUndoRedo.redo(a, p.change);
		expect(a).to.deep.equal({a: 2});
		
	
	*/

export class PropertyTrap {
	constructor() {
		this.change = [];
		this.valueRef = Object.create(null);
	}

	setProperty(obj, key, value, validate) {
		this.change.length = 0;
		let valueRef = this.valueRef;
		valueRef.value = value;
		let prev = obj[key];
		// validate is supposed to mangle the value if needed, it can change value to be appropriate
		if (validate(obj, 'set', key, valueRef, prev)) {
			obj[key] = valueRef.value;
			this.change = ['set', key, valueRef.value, prev];
		} else {
			return false;
		}

		return true;
	}

	deleteProperty(obj, key, validate) {
		this.change.length = 0;
		let valueRef = this.valueRef;
		valueRef.value = undefined;
		let prev = obj[key];
		let approved = validate(obj, 'delete', key, valueRef, prev);
		let changed = approved;
		if (approved) {
			delete obj[key];
		} else {
			// if deletion is not approved, the effect is we can set default value in validator instead
			if (obj[key] != valueRef.value && valueRef.value !== undefined) {
				obj[key] != valueRef.value;
				changed = true;
			}
		}
		if (changed) {
			this.change = ['delete', key, valueRef.value, prev];
		}
		return approved;
	}
}
