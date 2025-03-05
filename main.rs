#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use std::fs::write;
use std::fs::read as fs_read;
use tauri::{generate_context, generate_handler, Builder, Manager, RunEvent, State};
use serde_json::{to_string, from_slice};

type Entries = Mutex<HashMap<String, Entry>>;
const ENTRIES_PATH: &str = "entries.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Section {}
#[derive(Debug, Clone, Serialize, Deserialize)]
struct Entry {
	description: String,
	sections: Vec<Section>,
}

#[tauri::command]
fn read(state: State<Entries>) -> HashMap<String, Entry> {
	state.lock().unwrap().clone()
}
#[tauri::command]
fn add(state: State<Entries>, key: String, entry: Entry) {
	state.lock().unwrap().insert(key, entry);
}

fn main() {
	Builder::default()
		.invoke_handler(generate_handler!(add, read))
		.setup(|application| {
			let mut entries = from_slice::<HashMap<String, Entry>>(&fs_read(ENTRIES_PATH).unwrap()).unwrap();

			entries.insert(
				"example1".into(),
				Entry {
					description: "example_name1".into(),
					sections: vec![],
				},
			);
			entries.insert(
				"example2".into(),
				Entry {
					description: "example_name2".into(),
					sections: vec![],
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
