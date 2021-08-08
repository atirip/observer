import { html, render, useState } from 'https://unpkg.com/htm/preact/standalone.module.js'

import useObserver from '../../extra/useObserver.js'

// object state without calls to setState()
function App() {
	let state = useObserver(useState, {val:1})

	function click() {
		state.val += 1
	}
	
	return html`
		<div>
			Counter: ${state.val}<br/>
			<button onclick=${click}>press</button>
		</div>
	`
}
render(html`<${App} />`, document.body)