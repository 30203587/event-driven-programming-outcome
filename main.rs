#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use markdown::tokenize;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use std::fs::write;
use std::fs::read as fs_read;
use tauri::{generate_context, generate_handler, Builder, Manager, RunEvent, State};
use serde_json::{to_string, from_slice};

const ENTRIES_PATH: &str = "entries.json";
type Entries             = Mutex<HashMap<String, Entry>>;

#[derive(Debug, Clone, Serialize, Deserialize)]
enum Element {
	Lol(String),
	Yyy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Entry {
	description: String,
	date: String,
	sections: Vec<Element>,
}

#[tauri::command]
fn read(state: State<Entries>) -> HashMap<String, Entry> {
	state.lock().unwrap().clone()
}
#[tauri::command]
fn add(state: State<Entries>, key: String, value: Entry) {
	state.lock().unwrap().insert(key, value);
}
#[tauri::command]
fn remove(state: State<Entries>, key: &str) {
	state.lock().unwrap().remove(key);
}
#[tauri::command]
fn import_markdown(state: State<Entries>, markdown: &str) {
	let ast = tokenize(markdown);

	println!("{:?}", ast);
	
	state.lock().unwrap().insert("example".into(), Entry {
		description: String::new(),
		date: String::new(),
		sections: vec!(),
	});
}

fn main() {
	Builder::default()
		.invoke_handler(generate_handler!(
			add,
			read,
			import_markdown,
			remove,
		))
		.setup(|application| {
			let mut entries = from_slice::<HashMap<String, Entry>>(&fs_read(ENTRIES_PATH).unwrap()).unwrap();

			entries.insert(
				"example1".into(),
				Entry {
					description: "example_name1".into(),
					date: "20/20/2025".into(),
					sections: vec!(
						Element::Lol("asdsa".to_string()),
					),
				},
			);
			entries.insert(
				"example2".into(),
				Entry {
					description: "example_name2".into(),
					date: "20/20/2023".into(),
					sections: vec!(),
				},
			);

			application.manage::<Entries>(Mutex::new(entries));

			Ok(())
		})
		.build(generate_context!())
		.unwrap()
		.run(|application, event| {
			if let RunEvent::ExitRequested { .. } = event {
				let entries = application.state::<Entries>();
				let entries = entries.lock().unwrap();

				write(ENTRIES_PATH, to_string(&*entries).unwrap()).unwrap();
			}
		})
}
