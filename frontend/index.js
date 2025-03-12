// Constants

const { invoke } = __TAURI__.core;
import { html, render, useState, useEffect } from "/htm.js";

const PAGE_ENTRY   = 1;
const PAGE_MANAGER = 0;

const COLOR_ALTERNATIVE = "#ff0000";
const COLOR_PRIMARY     = "#ff0000";
const COLOR_SECONDARY   = "#ff0000";

// Functions

async function add(setDiary, entry, key) {
	await invoke("insert", {
		key: key,
		value: entry,
	});

	setDiary(diary => {
		diary.entries[key] = entry;

		return {...diary}
	})
}
async function addGoal(setDiary, goal) {
	await invoke("insert_goal", {
		goal: goal,
	});

	setDiary(diary => {
		diary.goals.push(goal);

		return {...diary}
	})
}
async function remove(key, setDiary) {
	await invoke("remove", {
		key: key,
	});

	setDiary(diary => {
		delete diary.entries[key];

		return {...diary}
	})
}
async function removeGoal(index, setDiary) {
	await invoke("remove_goal", {
		index: index,
	});

	setDiary(diary => {
		diary.goals.splice(index, 1);

		return {...diary}
	})
}
function addSection(setDiary, key, value) {
	setDiary(diary => {
		invoke("insert", {
			key: key,
			value: diary.entries[key],
		});

		diary.entries[key].sections.push(value);

		return {...diary}
	})
}
async function what(event, key) {
	let data = await event.target.files[0].text();

	await invoke("upload_file", {
		key: key,
		data: data,
	});
}
function insertText(text, setDiary, index, name) {
	setDiary(diary => {
		diary.entries[name].sections[index].Text[0] = text;

		return {...diary}
	})
}
function setTitle(setDiary, old_key, new_key, setPage) {
	setDiary(diary => {
		let temp = diary.entries[old_key];
		delete diary.entries[old_key];
		diary.entries[new_key] = temp;

		return {...diary}
	});
	setPage(page => {
		page[1] = new_key;

		return [...page]
	});
}
function lol(event, setDiary, index) {
	setDiary(diary => {
		diary.entries[page[1]].sections[index]

		return {...diary}
	})
}

// Elements

//// Diary View (design/wireframe-1.svg)

function Element(props) {
	let contents;

	switch (Object.keys(props.section)[0]) {
		case "Image":
			contents = html`<div>
				<input type="file" oninput=${event => what(event, props.entryName)}>Insert Image</input>
			</div>`;
			break
		case "Text":
			let goals_display = [];

			for (let goal of props.goals) {
				goals_display.push(html`<input type="checkbox" oninput=${event => lol(event)}>${goal}</input>`)
			}

			contents = html`<div>
				<input class="float-left" oninput=${event => insertText(event.target.value, props.setDiary, props.index, props.entryName)}>${props.section["Text"]}</input>
				<div class="flex bg-purple-900 float-right">
				${goals_display}
				</div>
			</div>`;
			break
	}

	return contents
}
function Entry(props) {
	if (props.example) {
		return html`<div class="bg-green-600 flex flex-row">
			<p>${props.name}</p>
			<button onMouseDown=${() => add(props.setDiary, props.entry, props.name)}>Add 📅</button>
		</div>`;
	} else {
		return html`<div class="bg-green-500 flex flex-row">
			<p>${props.name}</p>
			<button onMouseDown=${() => remove(props.name, props.setDiary)}>Remove 📅</button>
			<button onMouseDown=${() => props.setPage([ PAGE_ENTRY, props.name ])}>View 📔</button>
			<p>${props.entry.day}.${props.entry.month}.${props.entry.year}</p>
		</div>`;
	}
}
function Goal(props) {
	if (props.example) {
		return html`<div class="bg-green-600 flex flex-row">
			<p>${props.goal}</p>
			<button onMousedown=${() => addGoal(props.setDiary, props.goal)}>Add 📅</button>
		</div>`;
	} else {
		return html`<div class="bg-green-500 flex flex-row">
			<p>${props.goal}</p>
			<button onmousedown=${() => removeGoal(props.index, props.setDiary)}>Remove 📅</button>
		</div>`;
	}
}
function DiaryView(props) {
	let [searchName, setSearchName] = useState("");

	let entries_display = [];

	for (let [key, value] of Object.entries(props.diary.entries)) {
		entries_display.push(html`<${Entry} name=${key} entry=${value} example=${false} setPage=${props.setPage} setDiary=${props.setDiary}/>`);
	}

	let example = {
		description: "",
		date: "",
		sections: [],
		day: 0,
		month: 0,
		year: 0,
	};
	entries_display.push(html`<${Entry} name="<example>" entry=${example} example=${true} setPage=${props.setPage} setDiary=${props.setDiary}/>`);

	let goals_display = [];

	let i = 0;
	for (; i < props.diary.goals.length; i++) {
		goals_display.push(html`<${Goal} index=${i} example=${false} goal=${props.diary.goals[i]} setDiary=${props.setDiary}/>`);
	}
	goals_display.push(html`<${Goal} index="${i}" goal="<example>" example=${true} setPage=${props.setPage} setDiary=${props.setDiary}/>`);

	return html`<div class="bg-[${COLOR_PRIMARY}] w-screen h-screen grid grid-rows-[10%_90%] grid-cols-[10%_90%]">
		<div class="row-span-2">
		${goals_display}
		</div>
		<div class="bg-pink-900">
			<input onInput=${event => setSearchName(event.target.value)}></input>
		</div>
		<div class="bg-blue-500 flex flex-col">
		${entries_display}
		</div>
	</div>`;
}

//// Entry View (design/wireframe-2.svg)

function EntryView(props) {
	let display_elements = [];

	for (let i = 0; i < props.diary.entries[props.page[1]].sections.length; i++) {
		display_elements.push(html`<${Element} section=${props.diary.entries[props.page[1]].sections[i]} index=${i} entryName=${props.page[1]} setDiary=${props.setDiary} goals=${props.diary.goals}/>`);
	}

	return html`<div class="bg-green-500 grid-cols-1 grid-rows-1 grid w-screen h-screen">
		<div class="flex flex-row">
			<input value=${props.page[1]} oninput=${event => setTitle(props.setDiary, props.page[1], event.target.value, props.setPage)}>${props.page[1]}</input>
			<button onmousedown=${() => addSection(props.setDiary, props.page[1], { "Text": ["sadj", []] })}>Add Text</button>
			<button onmousedown=${() => addSection(props.setDiary, props.page[1], { "Image": "asjdij" })}>Add Image</button>
			<button onmousedown=${() => props.setPage([PAGE_MANAGER, null])}>Back</button>
		</div>
		<div class="flex flex-col">
		${display_elements}
		</div>
	</div>`;
}

// Main

function App() {
	let [diary, setDiary] = useState(null);
	let [page, setPage]   = useState([PAGE_MANAGER, null]);

	useEffect(async () => {
		let temp_diary = await invoke("read", {});

		setDiary(temp_diary);
	}, []);

	if (diary !== null) {
		switch (page[0]) {
			case PAGE_MANAGER:
				return html`<${DiaryView} diary=${diary} setDiary=${setDiary} setPage=${setPage}/>`;
			case PAGE_ENTRY:
				return html`<${EntryView} diary=${diary} setDiary=${setDiary} page=${page} setPage=${setPage}/>`;
		}
	}
}
render(html`<${App}/>`, document.body);
