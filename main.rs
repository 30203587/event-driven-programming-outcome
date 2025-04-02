// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Imports

use std::{
    fs::{
        read as fs_read,
        write,
        create_dir_all,
    },

    collections::HashMap,
    path::PathBuf,
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
#[test] use proptest::prelude::*;

// Constants

const ENTRIES_PATH: &str      = "entries.json";
const FILE_UPLOADS_PATH: &str = "entries";
const PROGRAM_NAME: &str      = "metakey";
#[cfg(target_os = "windows")] const HOME: &str = "UserProfile";
#[cfg(target_os = "linux")] const HOME: &str = "HOME";

// Data Structures

// Stores data added to a diary entry
#[derive(Debug, Clone, Serialize, Deserialize)]
enum Element {
    Text(String),
    Image(String),
    Heading(String),
}

// Stores the list of entries and goals for the application
#[derive(Debug, Clone, Serialize, Deserialize)]
struct Diary {
    entries: HashMap<String, Entry>,
    goals: Vec<String>,
}
// A single diary entry that stores when it was entered along with the sections used
#[derive(Debug, Clone, Serialize, Deserialize)]
struct Entry {
    day: u8, // Starts from 1 (1-31)
    month: u8, // Starts from 1 (1-12)
    year: u64,
    sections: Vec<Element>,
    fulfilled_goals: HashMap<String, ()>,
}


impl Diary {
    fn import_markdown(markdown: &str) -> Vec<Element> {
        let mut sections = vec!();

        for token in tokenize(markdown) {
            match token {
                Block::Header(span, _) => for element in span {
                    sections.extend(Diary::match_span(element))
                },
                Block::Paragraph(span) => for element in span {
                    sections.extend(Diary::match_span(element))
                },
                Block::UnorderedList(span) => {},
                Block::Blockquote(span) => {},
                Block::CodeBlock(_, _) => {},
                Block::OrderedList(_, _) => {},
                Block::Raw(_) => {},
                Block::Hr => {},
            }
        }

        sections
    }
    fn match_span(span: Span) -> Vec<Element> {
        let mut elements = vec!();

        match span {
            Span::Break => {},
            Span::Text(text) => elements.push(Element::Text(text)),
            Span::Code(text) => elements.push(Element::Text(text)),
            Span::Link(text, _, _)  => elements.push(Element::Text(text)),
            Span::Image(text, _, _) => elements.push(Element::Text(text)),
            Span::Emphasis(span) => for element in span {
                elements.extend(Self::match_span(element))
            },
            Span::Strong(span) => for element in span {
                elements.extend(Self::match_span(element))
            },
        }

        elements
    }
    fn insert_goal(&mut self, goal: String) {
        self.goals.push(goal)
    }
}
impl Entry {
    fn upload_file(&self) {
        todo!()
    }
}

// Endpoints

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
    state.lock().unwrap().insert_goal(goal)
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
fn import_markdown(markdown: &str) -> Vec<Element> {
    Diary::import_markdown(markdown)
}
#[tauri::command]
fn upload_file(diary: State<Mutex<Diary>>, paths: State<(PathBuf, PathBuf, PathBuf)>, key: String, index: usize, name: String, data: Vec<u8>) -> Result<(), String> {
    let mut diary = diary.lock().unwrap();
    let entry = diary.entries.get_mut(&key).unwrap();

    entry.sections[index] = Element::Image(name.clone());

    write(format!("{}/{name}", paths.1.display()), data).map_err(|err| err.to_string())
}
#[tauri::command]
fn get_paths(paths: State<(PathBuf, PathBuf, PathBuf)>) -> (PathBuf, PathBuf, PathBuf) {
    (*paths).clone()
}
#[tauri::command]
fn set_goal_name(diary: State<Mutex<Diary>>, index: usize, value: String) -> Option<()> {
    *diary.lock().unwrap().goals.get_mut(index)? = value;

    None
}
#[tauri::command]
fn fulfill_goal(diary: State<Mutex<Diary>>, goal: String, entry_name: String) {
    let mut diary = diary.lock().unwrap();
    let entry = diary.entries.get_mut(&entry_name).unwrap();

    if entry.fulfilled_goals.contains_key(&goal) {
        entry.fulfilled_goals.remove(&goal);
    } else {
        entry.fulfilled_goals.insert(goal, ());
    }
}

// Testing

#[test] proptest! {
    #[test]
    fn upload_file(input in "abcd") {
	let mut diary = Diary {
		entries: HashMap::new(),
		goals: vec!(),
	};

	diary.insert_goal(input)
    }
    #[test]
    fn test_import_markdown(input in "# asdsa") {
        Diary::import_markdown(&input);
    }
}

// Application

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
                fulfill_goal,
        ))
        .setup(|application| {
            // Constructing paths used for stores the applications data
            let program_path = PathBuf::from(format!("{}/{PROGRAM_NAME}", var(HOME)?));
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

            // Mutex used to fulfill Send + Sync requirement on endpoints, even though the
            // application doesn't currently invoke endpoints in parallel
            application.manage(Mutex::new(diary));
            application.manage((entries_path, file_uploads_path, program_path));

            Ok(())
        })
    .build(generate_context!())
        .unwrap()
        .run(|application, event| if let RunEvent::ExitRequested { .. } = event {
            // Gets the paths for used for the application, and writes the diary to it when the
            // user exists the application
            let (entries_path, ..) = &*application.state::<(PathBuf, PathBuf, PathBuf)>();
            let diary              = application.state::<Mutex<Diary>>();
            let diary              = diary.lock().unwrap();

            // Unwraps used as the program is already exiting so it doesn't
            // matter whether the application crashed or not as this time
            write(&entries_path, to_string(&*diary).unwrap()).unwrap();
        })
}
