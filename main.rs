#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Imports

use std::{
	fs::{
		read as fs_read,
		write,
		create_dir_all,
	},


	path::PathBuf,
	collections::HashMap,
	sync::Mutex,
        env::var,
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

// Constants

const ENTRIES_PATH: &str      = "entries.json";
const FILE_UPLOADS_PATH: &str = "entries";
const PROGRAM_PATH: &str      = "edp-outcome";
#[cfg(target_os = "windows")] const HOME: &str = "UserProfile";
#[cfg(target_os = "linux")] const HOME: &str = "HOME";

// Data Structures

// Stores data added to a diary entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
enum Element {
	Text(String, Vec<String>),
	Image(String),
	Heading(String),
}

// Stores the list of entries and goals for the application.
#[derive(Debug, Clone, Serialize, Deserialize)]
struct Diary {
	entries: HashMap<String, Entry>,
	goals: Vec<String>,
}
// A single diary entry that stores when it was entered along with the sections used.
#[derive(Debug, Clone, Serialize, Deserialize)]
struct Entry {
	day: u8, // Starts from 1 (1-31)
	month: u8, // Starts from 1 (1-12)
	year: u64,
	sections: Vec<Element>,
}

// Test Functions

#[test]
fn what() {
	println!("{:?}", 32);
}

// Executable Functions

#[tauri::command]
fn read(state: State<Mutex<Diary>>) -> Diary {
        // Unwrapping lock used as it is very unlikely the program panics when using one
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
fn set_date(state: State<Mutex<Diary>>, entry: &str, day: u8, month: u8, year: u64) {
	let mut state = state.lock().unwrap();
	let entry = state.entries.get_mut(entry).unwrap();

	entry.day   = day;
	entry.month = month;
	entry.year  = year;
}
#[tauri::command]
fn remove_goal(state: State<Mutex<Diary>>, index: usize) {
	state.lock().unwrap().goals.remove(index);
}
#[tauri::command]
fn import_markdown(diary: State<Mutex<Diary>>, markdown: &str) -> Result<Vec<Element>, String> {
        let mut sections = vec!();

	for token in tokenize(markdown) {
		match token {
			Block::Header(lol, _) => {
				let Span::Text(ref text) = lol[0] else { todo!() };

                                sections.push(Element::Heading(text.to_string()));
			},
                        Block::Paragraph(span) => {
                            for element in span {
                            }
                        }
                        Block::UnorderedList(span) => {},

                        _ => todo!()
		}
	}

	Ok(sections)
}
#[tauri::command]
fn upload_file(diary: State<Mutex<Diary>>, paths: State<(PathBuf, PathBuf)>, key: String, index: usize, name: String, data: Vec<u8>) -> Result<(), String> {
    let mut diary = diary.lock().unwrap();
    let entry = diary.entries.get_mut(&key).unwrap();

    entry.sections[index] = Element::Image(name.clone());

    write(format!("{}/{name}", paths.1.display()), data).map_err(|err| err.to_string())
}
#[tauri::command]
fn get_paths(paths: State<(PathBuf, PathBuf)>) -> (PathBuf, PathBuf) {
    (*paths).clone()
}
#[tauri::command]
fn set_goal_name(diary: State<Mutex<Diary>>, index: usize, value: String) -> Option<()> {
	*diary.lock().unwrap().goals.get_mut(index)? = value;

        None
}

// Main

fn main() {
    // Builds the GUI application
    Builder::default()
        // Generates endpoints used for invoking on the frontend
        .invoke_handler(generate_handler!(
                import_markdown,
                insert,
                insert_goal,
                read,
                remove,
                remove_goal,
                set_date,
                get_paths,
                upload_file,
                set_goal_name,
        ))
        .setup(|application| {
            // Constructing paths used for stores the applications data
            let program_path = PathBuf::from(format!("{}/{PROGRAM_PATH}", var(HOME)?));
            let entries_path = PathBuf::from(format!("{}/{ENTRIES_PATH}", program_path.display()));
            let file_uploads_path = PathBuf::from(format!("{}/{FILE_UPLOADS_PATH}", program_path.display()));

            let diary = if entries_path.exists() {
                // Read from already existing diary if available
                from_slice::<Diary>(&fs_read(&entries_path)?)?
            } else {
                // Create directory and data if the application doesn't exist already
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
                // Retrieve paths used for 
                let (entries_path, _) = &*application.state::<(PathBuf, PathBuf)>();
                let diary             = application.state::<Mutex<Diary>>();
                let diary             = diary.lock().unwrap();

                // Unwraps used as the program is already exiting so it doesn't
                // matter whether the application crashed or not as this time
                write(&entries_path, to_string(&*diary).unwrap()).unwrap();
            }
        })
}
