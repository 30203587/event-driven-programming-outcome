// Constants

const { invoke, convertFileSrc } = __TAURI__.core;
import { html, render, useState, useEffect } from "/htm.js";
//
let ddd = convertFileSrc("C:/Users/30203587/edp-outcome/entries/Untitled.png");
console.log(ddd);

let ppp = document.createElement("img");
ppp.src = ddd;
document.body.appendChild(ppp);

const PAGE_ENTRY   = 1;
const PAGE_MANAGER = 0;

const COLOR_ALTERNATIVE = "#f61067";
const COLOR_PRIMARY     = "#4e0250";
const COLOR_SECONDARY   = "#5c527a";

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
		diary.entries[key].sections.push(value);

		invoke("insert", {
			key: key,
			value: diary.entries[key],
		});

		return {...diary}
	})
}
async function uploadFile(event, setDiary, index, key) {
	let file = event.target.files[0];

	await setDiary(diary => {
		diary.entries[key].sections[index]["Image"] = file.name;

		return {...diary}
	})

	invoke("upload_file", {
		name: file.name,
		index: index,
		key: key,
		data: await file.text(),
	}).then(() => {})
	.catch((error) => console.log(error))
}
async function import_markdown(event) {
	let data = await event.target.files[0].text();

	data = await invoke("import_markdown", {
		markdown: data,
	});
	let example = {
		sections: [],
		day: 1,
		month: 1,
		year: 2000,
	}

	await invoke("insert", {
		key: "<imported_markdown>",
		value: {
			sections: [],
			day: 1,
			month: 1,
			year: 2000,
		},
	});

	setDiary(diary => {
		diary.entries[key] = entry;

		return {...diary}
	})


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
async function setGoalName(setDiary, index, value) {
	invoke("set_goal_name", {
		index: index,
		value: value,
	})

	setDiary(diary => {
		diary.goals[index] = value

		return { ...diary }
	})
}

// Elements

//// Diary View (design/wireframe-1.svg)

function Element(props) {
	switch (Object.keys(props.section)[0]) {
		case "Image":
			console.log(`C:/Users/30203587/edp-outcome/entries/${props.section.Image}`);
			let ddd = convertFileSrc(`C:/Users/30203587/edp-outcome/entries/${props.section.Image}`);

			console.log(ddd);

			return html`<div>
				<image src="${ddd}"></image>
				<input type="file" oninput=${event => uploadFile(event, props.setDiary, props.index, props.entryName)}>Insert Image</input>
			</div>`;
		case "Heading":
			return html`<div>${props.section["Heading"]}</div>`;
		case "Text":
			let goals_display = [];

			for (let goal of props.goals) {
				goals_display.push(html`<input type="checkbox" oninput=${event => lol(event)}>${goal}</input>`)
			}

			return html`<div>
				<input class="float-left" oninput=${event => insertText(event.target.value, props.setDiary, props.index, props.entryName)}>${props.section["Text"]}</input>
				<div class="flex bg-[${COLOR_PRIMARY}] float-right">
				${goals_display}
				</div>
			</div>`;
	}
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

	for (let [key, value] of Object.entries(props.diary.entries)) {
		if (key.match(new RegExp(searchName, "g"))) {
			entries_display.push(html`<${Entry} name=${key} entry=${value} example=${false} setPage=${props.setPage} setDiary=${props.setDiary}/>`);
		}
	}

	let example = {
		sections: [],
		day: 1,
		month: 1,
		year: 2000,
	};
	entries_display.push(html`<${Entry} name="<example>" entry=${example} example=${true} setPage=${props.setPage} setDiary=${props.setDiary}/>`);

	let goals_display = [];

	let i = 0;
	for (; i < props.diary.goals.length; i++) {
		goals_display.push(html`<${Goal} index=${i} example=${false} goal=${props.diary.goals[i]} setDiary=${props.setDiary}/>`);
	}
	goals_display.push(html`<${Goal} index="${i}" goal="<example>" example=${true} setPage=${props.setPage} setDiary=${props.setDiary}/>`);

	return html`<div class="bg-[${COLOR_PRIMARY}] w-screen h-screen grid grid-rows-[10%_90%] grid-cols-[25%_75%]">
		<div class="row-span-2 bg-[${COLOR_SECONDARY}]">
		<p class="text-white">List of SMART Goals:</p>
		${goals_display}
		</div>
		<div class="bg-[${COLOR_SECONDARY}]">
			<input onInput=${event => setSearchName(event.target.value)} placeholder="<Enter search entry name here>"></input>
			<input type="file" oninput=${import_markdown}>Import markdown file</input>
		</div>
		<div class="bg-[${COLOR_PRIMARY}] flex flex-col">
		<p class="text-white">List of diary entries:</p>
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

	let display_day   = props.diary.entries[props.page[1]].day.toString().padStart(2, "0");
	let display_month = props.diary.entries[props.page[1]].month.toString().padStart(2, "0");
	let display_year  = props.diary.entries[props.page[1]].year.toString().padStart(4, "0");

	return html`<div class="bg-[${COLOR_PRIMARY}] grid-cols-1 grid-rows-[10%_90%] grid w-screen h-screen">
		<div class="flex flex-row">
			<input value=${props.page[1]} oninput=${event => setTitle(props.setDiary, props.page[1], event.target.value, props.setPage)}></input>
			<input type="date" defaultValue="${display_year}-${display_month}-${display_day}" onInput=${event => setDate(event.target.value, props.setDiary, props.page[1])}></input>

			<button onmousedown=${() => addSection(props.setDiary, props.page[1], { "Text": ["sadj", []] })}>Add Text</button>
			<button onmousedown=${() => addSection(props.setDiary, props.page[1], { "Image": "asjdij" })}>Add Image</button>
			<button onmousedown=${() => addSection(props.setDiary, props.page[1], { "Heading": "asjdij" })}>Add Heading</button>
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
