function setObservedInstance(object, callback) {
	return new Proxy(object, {
		get(target, prop, receiver) {
			if (typeof target[prop] == "function") {
				return target[prop].bind(target);
			}
			let value = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(object), prop).get.bind(target);
			return value();
		},
		set(target, prop, val, receiver) {
			Object.getOwnPropertyDescriptor(Object.getPrototypeOf(object), prop).set.bind(target)(val);
			callback();
			return true;
		}
	});
}

function setObservedArray(arr, callback) {
	return new Proxy(arr, {
		get(target, prop, receiver) {
			return Reflect.get(target, prop, receiver);
		},
		set(target, prop, val, receiver) {
			let isOK = Reflect.set(target, prop, val, receiver);
			callback();
			return isOK;
		}
	});
}