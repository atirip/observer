import { createObserver } from '../observer.js'

// useState hook without the need to call setState
// requires state to be Object or Array 
export default function useObserver(useState, initial) {
	let [semaphore, setSemaphore] = useState(0);
	function triggerRender() {
		setSemaphore(semaphore += 1);
	}
	if (!semaphore) {
		initial = createObserver(initial || {}, triggerRender)
		// AFAIK render is triggered anyway after first call, so this is noop 
		triggerRender();
	}
	return useState(initial)[0];
}
