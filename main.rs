#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Constants

use std::{
	fs::{
		read as fs_read,
		write,
		create_dir_all,
	},

	path::PathBuf,
	collections::HashMap,
	sync::Mutex,
};
use serde::{
	Deserialize,
	Serialize,
};
use tauri::{
	Builder,
	Manager,
	RunEvent,
	State,

	generate_context,
	generate_handler,
};
use serde_json::{
	to_string,
	from_slice,
};
use markdown::{
    Block,
    Span,

    tokenize,
};

const ENTRIES_PATH: &str      = "entries.json";
const FILE_UPLOADS_PATH: &str = "entries";
const PROGRAM_PATH: &str      = "edp-outcome";

// Data Structures

#[derive(Debug, Clone, Serialize, Deserialize)]
enum Element {
	Text(String, Vec<String>),
	Image(String),
	Heading(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Diary {
	entries: HashMap<String, Entry>,
	goals: Vec<String>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
struct Entry {
	day: u8,
	month: u8,
	year: u64,
	sections: Vec<Element>,
}

// Functions

#[tauri::command]
fn read(state: State<Mutex<Diary>>) -> Diary {
	state.lock().unwrap().clone()
}
#[tauri::command]
fn insert(state: State<Mutex<Diary>>, key: String, value: Entry) {
	state.lock().unwrap().entries.insert(key, value);
}
#[tauri::command]
fn insert_goal(state: State<Mutex<Diary>>, goal: String) {
	state.lock().unwrap().goals.push(goal)
}
#[tauri::command]
fn remove(state: State<Mutex<Diary>>, key: &str) {
	state.lock().unwrap().entries.remove(key);
}
#[tauri::command]
fn remove_goal(state: State<Mutex<Diary>>, index: usize) {
	state.lock().unwrap().goals.remove(index);
}
#[tauri::command]
fn import_markdown(markdown: &str) -> Result<(), String> {
	let tokens = tokenize(markdown);

        for token in tokens {
            match token {
                Block::Header(lol, _) => {
                    let Span::Text(ref text) = lol[0] else { todo!() };

                    println!("{:?}", text);
                },

                _ => todo!(),
            }
        }

        Ok(())
}
#[tauri::command]
fn upload_file(paths: State<(PathBuf, PathBuf)>, key: String, data: String) -> Result<(), String> {
    write(format!("{}/{key}", paths.1.display()), data).map_err(|err| err.to_string())
}
#[tauri::command]
fn read_file(paths: State<(PathBuf, PathBuf)>, key: String) -> Result<Vec<u8>, String> {
    std::fs::read(format!("{}/{key}", paths.1.display())).map_err(|err| err.to_string())
}

// Main

fn main() {
	Builder::default()
		.invoke_handler(generate_handler!(
			import_markdown,
			insert,
			insert_goal,
			read,
			remove,
			remove_goal,
			upload_file,
		))
		.setup(|application| {
			let program_path = PathBuf::from(PROGRAM_PATH);
			let entries_path = PathBuf::from(format!("{}/{ENTRIES_PATH}", program_path.display()));
			let file_uploads_path = PathBuf::from(format!("{}/{FILE_UPLOADS_PATH}", program_path.display()));

			let diary = if entries_path.exists() {
				from_slice::<Diary>(&fs_read(&entries_path)?)?
			} else {
				create_dir_all(&file_uploads_path)?;

				Diary {
					entries: HashMap::new(),
					goals: vec!(),
				}
			};


			application.manage(Mutex::new(diary));
			application.manage((entries_path, file_uploads_path));

			Ok(())
		})
		.build(generate_context!())
		.unwrap()
		.run(|application, event| {
			if let RunEvent::ExitRequested { .. } = event {
				let (entries_path, _) = &*application.state::<(PathBuf, PathBuf)>();
				let diary             = application.state::<Mutex<Diary>>();
				let diary             = diary.lock().unwrap();

				write(&entries_path, to_string(&*diary).unwrap()).unwrap();
			}
		})
}
