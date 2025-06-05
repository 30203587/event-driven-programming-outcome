// Constants

const { invoke, convertFileSrc } = __TAURI__.core;
import { html, render, useState, useEffect } from "/htm.js";

const PAGE_ENTRY   = 1;
const PAGE_MANAGER = 0;

const COLOR_PRIMARY   = "#344966";
const COLOR_SECONDARY = "#FF6666";

const HELP_MESSAGE = `This is the diary view of the application, allowing you
to add, delete and specific diary entries; create, delete and edit goals; search
for entries; and create a diary entry from a markdown file.`;

// CRUD Functions

//// Asynchronous

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

	await setDiary(diary => {
		diary.goals.splice(index, 1);

		return {...diary}
	});
}
async function uploadFile(event, setDiary, index, key) {
	let file = event.target.files[0];

	try {
		await invoke("upload_file", {
			name: file.name,
			index: index,
			key: key,
			data: await file.arrayBuffer(),
		}).then(() => {})
	} catch (error) {
		alert(error);
	}

	setDiary(diary => {
		diary.entries[key].sections[index]["Image"] = file.name;

		return { ...diary }
	})
}
async function import_markdown(event, setDiary) {
	let data = await event.target.files[0].text();

	let sections = await invoke("import_markdown", {
		markdown: data,
	});
	let default_entry = {
		sections: sections,
		day: 1,
		month: 1,
		year: 2000,
		fulfilled_goals: {},
	}
	let key = "<imported_markdown>";

	await invoke("insert", {
		key: key,
		value: default_entry,
	});

	setDiary(diary => {
		diary.entries[key] = default_entry;

		return {...diary}
	})
}
async function setGoalName(setDiary, index, value) {
	invoke("set_goal_name", {
		index: index,
		value: value,
	})

	setDiary(diary => {
		let old_value = diary.goals[index];
		diary.goals[index] = value;

		for (let key of Object.keys(diary.entries)) {
			if (diary.entries[key].fulfilled_goals[old_value] !== undefined) {
				delete diary.entries[key].fulfilled_goals[old_value];
				diary.entries[key].fulfilled_goals[value] = {};
			}
		}

		return { ...diary }
	})
}
async function fulfillGoal(event, goal_name, setDiary, entry_name) {
	await invoke("fulfill_goal", {
		entryName: entry_name,
		goal: goal_name,
	});

	setDiary(diary => {
		if (event.target.checked) {
			diary.entries[entry_name].fulfilled_goals[goal_name] = [];
		} else {
			delete diary.entries[entry_name].fulfilled_goals[goal_name];
		}
		console.log(diary);

		return { ...diary }
	})
}

//// Synchronous

function addSection(setDiary, key, value) {
	setDiary(diary => {
		diary.entries[key].sections.push(value);

		invoke("insert", {
			key: key,
			value: diary.entries[key],
		});

		return {...diary}
	})
}
function removeSection(setDiary, key, index) {
	setDiary(diary => {
		diary.entries[key].sections.splice(index, 1);

		invoke("insert", {
			key: key,
			value: diary.entries[key],
		});

		return { ...diary }
	})
}
function insertText(text, setDiary, index, name) {
	setDiary(diary => {
		diary.entries[name].sections[index]["Text"] = text;

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
function setDate(date, setDiary, name) {
	date = new Date(date);

	let day = date.getDate() + 1;
	let month = date.getMonth() + 1;
	let year = date.getFullYear();

	invoke("set_date", {
		entry: name,
		day: day,
		month: month,
		year: year,
	})

	setDiary(diary => {
		diary.entries[name].day = day;
		diary.entries[name].month = month;
		diary.entries[name].year = year;

		return {...diary}
	})
}

// Elements

//// Diary View

function Element(props) {
	let contents;

	switch (Object.keys(props.section)[0]) {
		case "Image":
			let fileSource = convertFileSrc(`${props.paths[1]}/${props.section.Image}`);

			contents = html`<div>
				<img src="${fileSource}"></img>
				<input type="file" oninput=${event => uploadFile(event, props.setDiary, props.index, props.entryName)}>Insert Image</input>
			</div>`;
			break
		case "Heading":
			contents = html`<div>${props.section["Heading"]}</div>`;
			break
		case "Text":
			contents = html`<input class="w-full" oninput=${event => insertText(event.target.value, props.setDiary, props.index, props.entryName)} value="${props.section["Text"]}"></input>`;
			break
	}

	return html`<div>
	${contents}

	<button onmousedown=${() => removeSection(props.setDiary, props.entryName, props.index)}>Delete Element</button>
	</div>`
}
function Entry(props) {
	if (props.example) {
		return html`<div class="bg-[${COLOR_PRIMARY}] flex flex-row">
			<p>${props.name}</p>
			<button onMouseDown=${() => add(props.setDiary, props.entry, props.name)}>Add 📅</button>
		</div>`;
	} else {
		return html`<div class="bg-[${COLOR_PRIMARY}] flex flex-row">
			<p>${props.name}</p>
			<button onMouseDown=${() => remove(props.name, props.setDiary)}>Remove 📅</button>
			<button onMouseDown=${() => props.setPage([ PAGE_ENTRY, props.name ])}>View 📔</button>
			<p>${props.entry.day}.${props.entry.month}.${props.entry.year}</p>
		</div>`;
	}
}
function Goal(props) {
	if (props.example) {
		return html`<div class="text-white flex flex-row">
			<p>${props.goal}</p>
			<button onMousedown=${() => addGoal(props.setDiary, props.goal)}>Add 📅</button>
		</div>`;
	} else {
		return html`<div class="text-white flex flex-row">
			<input oninput=${event => setGoalName(props.setDiary, props.index, event.target.value)} value=${props.goal}></input>
			<button onmousedown=${() => removeGoal(props.index, props.setDiary)}>Remove 📅</button>
		</div>`;
	}
}
function DiaryView(props) {
	let [searchName, setSearchName] = useState("");

	let entries_display = [];

	let entries_array = Object.entries(props.diary.entries);
	for (let [key, value] of entries_array) {
		// Matches inputed search against the name of the entry, using regex
		if (key.match(new RegExp(searchName, "g"))) {
			entries_display.push(html`<${Entry} name=${key} entry=${value} example=${false} setPage=${props.setPage} setDiary=${props.setDiary}/>`);
		}
	}

	let example = {
		sections: [],
		day: 1,
		month: 1,
		year: 2000,
		fulfilled_goals: {},
	};
	entries_display.push(html`<${Entry} name="<example>" entry=${example} example=${true} setPage=${props.setPage} setDiary=${props.setDiary}/>`);

	let goals_display = [];

	let i = 0;
	for (; i < props.diary.goals.length; i++) {
		goals_display.push(html`<${Goal} index=${i} example=${false} goal=${props.diary.goals[i]} setDiary=${props.setDiary}/>`);
	}
	goals_display.push(html`<${Goal} index="${i}" goal="<example>" example=${true} setPage=${props.setPage} setDiary=${props.setDiary}/>`);

	if (entries_array.length == 0) {
		entries_display.push(html`<div class="bg-purple-500">
			<img src="/logo.svg"/>
			<p>${HELP_MESSAGE}</p>
		</div>`);
	}

	return html`<div class="bg-[${COLOR_PRIMARY}] w-screen h-screen grid grid-rows-[10%_90%] grid-cols-[25%_75%]">
		<div class="row-span-2 bg-[${COLOR_SECONDARY}]">
		<p class="text-white">List of SMART Goals:</p>
		${goals_display}
		</div>
		<div class="bg-[${COLOR_SECONDARY}] flex flex-row overflow-hidden justify-between p-[1%]">
			<input class="w-[50%]" onInput=${event => setSearchName(event.target.value)} placeholder="<Search for entry name here\>"></input>
			<input class="w-[50%]" type="file" oninput=${event => import_markdown(event, props.setDiary)}>Import Markdown File</input>
		</div>
		<div class="bg-[${COLOR_PRIMARY}] flex flex-col">
		<p class="text-white">List of diary entries:</p>
		${entries_display}
		</div>
	</div>`;
}

//// Entry View

function EntryView(props) {
	let display_elements = [];
	let display_goals = [];

	for (let goal of props.diary.goals) {
		console.log(">", props.diary.entries[props.page[1]].fulfilled_goals[goal])
		if (props.diary.entries[props.page[1]].fulfilled_goals[goal]) {
			display_goals.push(html`<input checked type="checkbox" oninput=${event => fulfillGoal(event, goal, props.setDiary, props.page[1])}>${goal}</input>`)
		} else {
			display_goals.push(html`<input type="checkbox" oninput=${event => fulfillGoal(event, goal, props.setDiary, props.page[1])}>${goal}</input>`)
		}
	}

for (let i = 0; i < props.diary.entries[props.page[1]].sections.length; i++) {
		display_elements.push(html`<${Element} paths=${props.paths} section=${props.diary.entries[props.page[1]].sections[i]} index=${i} entryName=${props.page[1]} setDiary=${props.setDiary} goals=${props.diary.goals}/>`);
	}

	let display_day   = props.diary.entries[props.page[1]].day.toString().padStart(2, "0");
	let display_month = props.diary.entries[props.page[1]].month.toString().padStart(2, "0");
	let display_year  = props.diary.entries[props.page[1]].year.toString().padStart(4, "0");

	return html`<div class="bg-[${COLOR_PRIMARY}] grid-cols-1 grid-rows-[10%_90%] grid w-screen h-screen">
		<div class="flex flex-row">
			<input value=${props.page[1]} oninput=${event => setTitle(props.setDiary, props.page[1], event.target.value, props.setPage)}></input>
			<input type="date" defaultValue="${display_year}-${display_month}-${display_day}" onInput=${event => setDate(event.target.value, props.setDiary, props.page[1])}></input>

			${display_goals}
			<button onmousedown=${() => props.setPage([PAGE_MANAGER, null])}>Back</button>
		</div>
		<div class="flex flex-col">
		${display_elements}

		<button onmousedown=${() => addSection(props.setDiary, props.page[1], { "Text": "<Example Text>" })}>Add Text</button>
		<button onmousedown=${() => addSection(props.setDiary, props.page[1], { "Image": "" })}>Add Image</button>
		<button onmousedown=${() => addSection(props.setDiary, props.page[1], { "Heading": "<Example Heading>" })}>Add Heading</button>
		</div>
	</div>`;
}

// Main

function App() {
	// Global states used across pages
	let [diary, setDiary] = useState(null);
	let [page, setPage]   = useState([PAGE_MANAGER, null]);
	let [paths, setPaths] = useState(null);

	useEffect(async () => {
		let temp_diary = await invoke("read", {});
		let temp_paths = await invoke("get_paths", {});

		setDiary(temp_diary);
		setPaths(temp_paths);
	}, []);

	if (diary !== null && paths != null) {
		switch (page[0]) {
			case PAGE_MANAGER:
				return html`<${DiaryView} diary=${diary} setDiary=${setDiary} setPage=${setPage}/>`;
			case PAGE_ENTRY:
				return html`<${EntryView} paths=${paths} diary=${diary} setDiary=${setDiary} page=${page} setPage=${setPage}/>`;
		}
	}
}
render(html`<${App}/>`, document.body);
