// Constants

// Functional

const { invoke, convertFileSrc } = __TAURI__.core;
import { html, render, useState, useEffect } from "/htm.js";

const PAGE_ENTRY   = 1;
const PAGE_MANAGER = 0;

// Styling

const COLOR_PRIMARY          = "#4059AD";
const COLOR_PRIMARY_LIGHT    = "#4765c9";
const COLOR_BACKGROUND       = "#222222";
const COLOR_BACKGROUND_LIGHT = "#424141";
const COLOR_ERROR            = "#CE2D4F";

const GAP          = "gap-[100px]";
const LIST_STYLING = `bg-[${COLOR_PRIMARY}] flex flex-row rounded-[5em]`;
const HELP_MESSAGE = `This is the diary view of the application, allowing you
to add, delete and specific diary entries; create, delete and edit goals; search
for entries; and create a diary entry from a markdown file.`;

// CRUD Functions

//// Endpoints

// Adds a single entry to the list of entries
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
// Adds a single goal to the list of goal
async function addGoal(setDiary, goal) {
	await invoke("insert_goal", {
		goal: goal,
	});

	setDiary(diary => {
		diary.goals.push(goal);

		return {...diary}
	})
}
// Removes a single entry
async function remove(key, setDiary) {
	await invoke("remove", {
		key: key,
	});

	setDiary(diary => {
		delete diary.entries[key];

		return {...diary}
	})
}
// Removes a single goal
async function removeGoal(index, setDiary) {
	await invoke("remove_goal", {
		index: index,
	});

	await setDiary(diary => {
		diary.goals.splice(index, 1);

		return {...diary}
	});
}
// Uploades a file contents to a location
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
// Converts a string to markdown and adds a default entryc
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
	// A default name for the entry
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
// Sets a signe goals name
async function setGoalName(setDiary, index, value) {
	invoke("set_goal_name", {
		index: index,
		value: value,
	})

	setDiary(diary => {
		let old_value = diary.goals[index];
		diary.goals[index] = value;

		// Figures out which entries contain the goal and switches the name of it
		// if found
		for (let key of Object.keys(diary.entries)) {
			if (diary.entries[key].fulfilled_goals[old_value] !== undefined) {
				delete diary.entries[key].fulfilled_goals[old_value];
				diary.entries[key].fulfilled_goals[value] = {};
			}
		}

		return { ...diary }
	})
}
// Fulfills a single goal
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

		return { ...diary }
	})
}
// Sets a single entry's date fields
async function setDate(date, setDiary, name) {
	date = new Date(date);

	let day   = date.getDate() + 1;
	let month = date.getMonth() + 1;
	let year  = date.getFullYear();

	try {
		await invoke("set_date", {
			entry: name,
			day: day,
			month: month,
			year: year,
		});
	} catch (error) {
		alert(error)
	}

	setDiary(diary => {
		diary.entries[name].day = day;
		diary.entries[name].month = month;
		diary.entries[name].year = year;

		return {...diary}
	})
}

//// Non-endpoints

// Adds a single section
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
// Removes a single section from an entry
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
// Inserts text into an entry
function insertText(text, setDiary, index, name) {
	setDiary(diary => {
		diary.entries[name].sections[index]["Text"] = text;

		return {...diary}
	})
}
// Sets the title of an entry, switching the pages reference to its name aswell
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

// Elements

//// Helper

// Message bubble to provide various instructions on how to use the application
// for an end user.
function helpMessage(props) {
	return html`<div class="bg-blue-900 w-[10em] h-[10em] border-8
	border-blue-500 rounded-[25%] text-center content-center ease-in-out
	duration-300 hover:w-[20em] h-[15em] overflow-hidden p-8">
		<p class="text-center">Help Message</p>
		<p class="text-left">${props.message}</p>
	</div>`
}

//// Entry View

// A single element that controls how an element is displayed
function Element(props) {
	let contents;

	switch (Object.keys(props.section)[0]) {
		case "Image":
			// Gets the upload location and applies to the element
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

	return html`<div class="${LIST_STYLING}">
	${contents}

	<button onmousedown=${() => removeSection(props.setDiary, props.entryName, props.index)}>Delete Element</button>
	</div>`
}
function Entry(props) {
	// If the goal is an example, display with a button do add an entry
	if (props.example) {
		return html`<div class="${LIST_STYLING} bg-[${COLOR_PRIMARY_LIGHT}]">
			<p>${props.name}</p>
			<button onMouseDown=${() => add(props.setDiary, props.entry, props.name)}>Add Entry ➕</button>
		</div>`;
	} else {
		return html`<div class="${LIST_STYLING}">
			<p>${props.name}</p>
			<button onMouseDown=${() => remove(props.name, props.setDiary)}>Remove 📅</button>
			<button onMouseDown=${() => props.setPage([ PAGE_ENTRY, props.name ])}>View 📔</button>
			<p>${props.entry.day}.${props.entry.month}.${props.entry.year}</p>
		</div>`;
	}
}
function Goal(props) {
	// If the goal is an example, display with a button do add a goal
	if (props.example) {
		return html`<div class="${LIST_STYLING} bg-[${COLOR_PRIMARY_LIGHT}]">
			<p>${props.goal}</p>
			<button onMousedown=${() => addGoal(props.setDiary, props.goal)}>Add Goal ➕</button>
		</div>`;
	} else {
		return html`<div class="${LIST_STYLING}">
			<input oninput=${event => setGoalName(props.setDiary, props.index, event.target.value)} value=${props.goal}></input>
			<button onmousedown=${() => removeGoal(props.index, props.setDiary)}>Remove 📅</button>
		</div>`;
	}
}
function EntryView(props) {
	let [searchName, setSearchName] = useState("");

	let entries_display = [];

	let entries_array = Object.entries(props.diary.entries);
	for (let [key, value] of entries_array) {
		// Matches inputed search against the name of the entry using a regex pattern
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
	entries_display.push(html`<${Entry} name="<example name>" entry=${example} example=${true} setPage=${props.setPage} setDiary=${props.setDiary}/>`);

	let goals_display = [];

	// Displays the list of goals along with an example goal
	let i = 0;
	for (; i < props.diary.goals.length; i++) {
		goals_display.push(html`<${Goal} index=${i} example=${false} goal=${props.diary.goals[i]} setDiary=${props.setDiary}/>`);
	}
	goals_display.push(html`<${Goal} index="${i}" goal="<example goal>" example=${true} setPage=${props.setPage} setDiary=${props.setDiary}/>`);

	return html`<div class="bg-[${COLOR_BACKGROUND_LIGHT}] w-screen h-screen grid grid-rows-[10%_90%] grid-cols-[25%_75%]">
		<div class="row-span-2 bg-[${COLOR_BACKGROUND_LIGHT}] border-r-[100px] ${GAP} border-[${COLOR_PRIMARY}]">
		${goals_display}
		<${helpMessage} message="List of SMART Goals"/>
		</div>
		<div class="flex flex-row overflow-hidden justify-between p-[1%] border-b-[50px]">
			<input class="w-[50%]" onInput=${event => setSearchName(event.target.value)} placeholder="<Search for entry name here\>"></input>
			<input class="w-[50%] rounded-[10px] border-[10px]" type="file" oninput=${event => import_markdown(event, props.setDiary)}>Import Markdown File</input>
		</div>
		<div class="flex flex-col ${GAP} bg-gradient-to-t from-[${COLOR_PRIMARY}] to-[${COLOR_BACKGROUND}] to-75% h-[100%] p-10 bg-radial-[at_75%_100%] gap-4">
		${entries_display}
		<${helpMessage} message="${HELP_MESSAGE}"/>
		</div>
	</div>`;
}

//// Diary View

function DiaryView(props) {
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

	return html`<div class="grid-cols-1 grid-rows-[10%_90%] grid w-screen h-screen">
		<div class="flex flex-row bg-[${COLOR_BACKGROUND_LIGHT}]">
			<input value=${props.page[1]} oninput=${event => setTitle(props.setDiary, props.page[1], event.target.value, props.setPage)}></input>
			<input type="date" defaultValue="${display_year}-${display_month}-${display_day}" onInput=${event => setDate(event.target.value, props.setDiary, props.page[1])}></input>

			${display_goals}
			<button onmousedown=${() => props.setPage([PAGE_MANAGER, null])}>⟵</button>
		</div>
		<div class="flex flex-col bg-gradient-to-t from-[${COLOR_ERROR}] to-[${COLOR_BACKGROUND}] to-75% h-[100%] p-10 bg-radial-[at_75%_100%] ">
		${display_elements}

		<button onmousedown=${() => addSection(props.setDiary, props.page[1], { "Text": "<Example Text>" })}>Add Text</button>
		<button onmousedown=${() => addSection(props.setDiary, props.page[1], { "Image": "" })}>Add Image</button>
		<button onmousedown=${() => addSection(props.setDiary, props.page[1], { "Heading": "<Example Heading>" })}>Add Heading</button>
		<${helpMessage} message="In this page, a entry can have its components edited along with its content"/>
		</div>
	</div>`;
}

// Main

function App() {
	// States used across pages
	let [diary, setDiary] = useState(null);
	let [page, setPage]   = useState([PAGE_MANAGER, null]);
	let [paths, setPaths] = useState(null);

	useEffect(async () => {
		// Retrieve the diary and paths used for uploading images
		let temp_diary = await invoke("read", {});
		let temp_paths = await invoke("get_paths", {});

		setDiary(temp_diary);
		setPaths(temp_paths);
	}, []);

	// Don't render HTML until the above states have been fetched
	if (diary !== null && paths != null) {
		// Choose page
		switch (page[0]) {
			case PAGE_MANAGER:
				return html`<${EntryView} diary=${diary} setDiary=${setDiary} setPage=${setPage}/>`;
			case PAGE_ENTRY:
				return html`<${DiaryView} paths=${paths} diary=${diary} setDiary=${setDiary} page=${page} setPage=${setPage}/>`;
		}
	}
}
render(html`<${App}/>`, document.body);
