// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Imports

use std::{
    fs::{
        read as fs_read,
        write,
        create_dir_all,
    },
    path::{
        Path,
        PathBuf,
    },

    error::Error,
    io::Result as IoResult,

    collections::HashMap,
    num::NonZeroU8,
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
    ListItem,

    Span,

    tokenize,
};

// Constants

const ENTRIES_PATH: &str      = "entries.json";
const FILE_UPLOADS_PATH: &str = "entries";
const PROGRAM_NAME: &str      = "metakey";
#[cfg(target_os = "windows")] const HOME: &str = "UserProfile";
#[cfg(target_os = "linux")] const HOME: &str = "HOME";

// Data Structures

/// Stores data added to a diary entry
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
enum Element {
    Text(String),
    Image(String),
    Heading(String),
}

/// Stores the list of entries and goals for the application
#[derive(Debug, Clone, Serialize, Deserialize)]
struct Diary {
    entries: HashMap<String, Entry>,
    goals: Vec<String>,
}
/// A single diary entry that stores when it was entered along with the sections used
#[derive(Debug, Clone, Serialize, Deserialize)]
struct Entry {
    day: NonZeroU8, // Starts from 1 (1-31)
    month: NonZeroU8, // Starts from 1 (1-12)
    year: u64,
    sections: Vec<Element>,
    fulfilled_goals: HashMap<String, ()>, // HashMap instead of HashSet as serde-json requires
                                          // JavaScript to use an array instead, which hinders its
                                          // lookup speed on the frontend
}


impl Diary {
    /// Sets the date of an entry, according to their representation in Javascript
    fn set_date(&mut self, entry: &str, day: NonZeroU8, month: NonZeroU8, year: u64) -> Result<(), String> {
        let entry = self.entries.get_mut(entry).ok_or("Entry doesn't exist".to_string())?;

        if day.get() > 31 {
            Err(format!("Day cannot be a value more than 31, supplied: {day}"))?
        }
        if month.get() > 12 {
            Err(format!("Day cannot be a value more than 12, supplied: {month}"))?
        }

        entry.day   = day;
        entry.month = month;
        entry.year  = year;

        Ok(())
    }
    /// Write image to data file path, modifying a single diary entry's section with the name of
    /// the image
    fn upload_image(&mut self, file_uploads_path: &Path, key: String, index: usize, name: String, data: &[u8]) -> Result<(), String> {
        let entry = self.entries.get_mut(&key).unwrap();

        entry.sections[index] = Element::Image(name.clone());

        write(format!("{}/{name}", file_uploads_path.display()), data).map_err(|err| err.to_string())
    }
    /// Converts the diary to JSON and saves it into the supplied path, creating the file if it
    /// doesn't already exist
    fn save(&self, path: &Path) -> IoResult<()> {
        write(path, to_string(self)?)
    }
    /// Converts markdown to an AST of supported elements for rendering, later converted to JSON to
    /// store in the users home directory
    fn import_markdown(blocks: Vec<Block>) -> Vec<Element> {
        let mut sections = vec!();

        for token in blocks {
            match token {
                Block::Header(span, _) => for element in span {
                    match element {
                        Span::Break      => {},
                        Span::Text(text) => sections.push(Element::Heading(text)),

                        // Other span elements are currently unsupported in headings
                        _ => todo!()
                    }
                },
                Block::Paragraph(span) => for element in span {
                    sections.extend(Self::match_span(element))
                },
                Block::Blockquote(blocks) => sections.extend(Self::import_markdown(blocks)),
                Block::Hr => {},
                Block::Raw(contents) => sections.push(Element::Text(contents)),
                Block::OrderedList(list_items, _) | Block::UnorderedList(list_items) => for list_item in list_items {
                    match list_item {
                        ListItem::Simple(span) => for element in span {
                            sections.extend(Self::match_span(element))
                        }
                        ListItem::Paragraph(blocks) => sections.extend(Self::import_markdown(blocks)),
                    }
                },
                Block::CodeBlock(language, contents) => sections.push(Element::Text(match language {
                    None           => contents,
                    Some(language) => format!("{language}: {contents}"),
                })),
            }
        }

        sections
    }
    /// Matches an individual span element
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
}

// Testing

#[test]
fn save_diary_normal() -> IoResult<()> {
    let diary = Diary {
        entries: HashMap::new(),
        goals: vec!(),
    };

    diary.save(Path::new("target/diary.json"))
}
#[test]
#[should_panic]
fn save_diary_exceptional() {
    let diary = Diary {
        entries: HashMap::new(),
        goals: vec!(),
    };

    diary.save(Path::new("target/")).unwrap()
}

#[test]
fn import_markdown_normal() {
    assert_eq!(Diary::import_markdown(tokenize("# Heading")), vec!(Element::Heading("Heading".into())));
    assert_eq!(Diary::import_markdown(tokenize("Text")), vec!(Element::Text("Text".into())));
    assert_eq!(Diary::import_markdown(tokenize("- List Item")), vec!(Element::Text("List Item".into())));
}
#[test]
fn import_markdown_boundary() {
    assert_eq!(Diary::import_markdown(tokenize("#")), vec!(Element::Text("".into())));
    assert_eq!(Diary::import_markdown(tokenize("")), vec!());
}

#[test]
fn upload_image_normal() -> Result<(), String> {
    let mut diary = Diary {
        entries: HashMap::from([
            ("example".into(), Entry {
                day: NonZeroU8::new(1).unwrap(),
                month: NonZeroU8::new(1).unwrap(),
                year: 0,
                sections: vec!(Element::Text("example".to_string())),
                fulfilled_goals: HashMap::new(),
            })
        ]),
        goals: vec!(),
    };

    diary.upload_image(Path::new(PROGRAM_NAME), "example".into(), 0, "example".into(), b"example")
}
#[test]
fn upload_image_boundary() -> Result<(), String> {
    let mut diary = Diary {
        entries: HashMap::from([
            ("example".into(), Entry {
                day: NonZeroU8::new(1).unwrap(),
                month: NonZeroU8::new(1).unwrap(),
                year: 0,
                sections: vec!(Element::Text("example".into())),
                fulfilled_goals: HashMap::new(),
            })
        ]),
        goals: vec!(),
    };

    diary.upload_image(Path::new(PROGRAM_NAME), "example".into(), 0, "example".into(), b"example")
}
#[test]
#[should_panic]
fn upload_image_exceptional() {
    let mut diary = Diary {
        entries: HashMap::new(),
        goals: vec!(),
    };

    diary.upload_image(Path::new(PROGRAM_NAME), "example".into(), 0, "example".into(), b"example").unwrap();
}

#[test]
fn set_date_normal() -> Result<(), String> {
    let mut diary = Diary {
        entries: HashMap::from([
            ("example".into(), Entry {
                day: NonZeroU8::new(1).unwrap(),
                month: NonZeroU8::new(1).unwrap(),
                year: 0,
                sections: vec!(Element::Text("example".to_string())),
                fulfilled_goals: HashMap::new(),
            })
        ]),
        goals: vec!(),
    };

    diary.set_date("re", NonZeroU8::new(1).unwrap(), NonZeroU8::new(1).unwrap(), 4)
}
#[test]
fn set_date_boundary() -> Result<(), String> {
    let mut diary = Diary {
        entries: HashMap::new(),
        goals: vec!(),
    };

    diary.set_date("re", NonZeroU8::new(1).unwrap(), NonZeroU8::new(1).unwrap(), 4)
}
#[test]
#[should_panic]
fn set_date_exceptional() {
    let mut diary = Diary {
        entries: HashMap::from([
            ("example".into(), Entry {
                day: NonZeroU8::new(1).unwrap(),
                month: NonZeroU8::new(1).unwrap(),
                year: 0,
                sections: vec!(Element::Text("example".to_string())),
                fulfilled_goals: HashMap::new(),
            })
        ]),
        goals: vec!(),
    };

    diary.set_date("", NonZeroU8::new(0).unwrap(), NonZeroU8::new(1).unwrap(), 0).unwrap();
    diary.set_date("", NonZeroU8::new(0).unwrap(), NonZeroU8::new(1).unwrap(), 0).unwrap();
    diary.set_date("", NonZeroU8::new(1).unwrap(), NonZeroU8::new(1).unwrap(), 0).unwrap();
}

// Endpoints

#[tauri::command]
fn read(state: State<Mutex<Diary>>) -> Diary {
    // Unwrapping lock used as it is very unlikely the program panics in other threads
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
fn set_date(diary: State<Mutex<Diary>>, entry: &str, day: NonZeroU8, month: NonZeroU8, year: u64) -> Result<(), String> {
    let mut diary = diary.lock().unwrap();

    diary.set_date(entry, day, month, year)
}
#[tauri::command]
fn remove_goal(state: State<Mutex<Diary>>, index: usize) {
    state.lock().unwrap().goals.remove(index);
}
#[tauri::command]
fn import_markdown(markdown: &str) -> Vec<Element> {
    Diary::import_markdown(tokenize(markdown))
}
#[tauri::command]
fn upload_file(diary: State<Mutex<Diary>>, paths: State<(PathBuf, PathBuf, PathBuf)>, key: String, index: usize, name: String, data: Vec<u8>) -> Result<(), String> {
    let mut diary = diary.lock().unwrap();

    diary.upload_image(&paths.1, key, index, name, &data)
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

// Application

/// The entry point of the application, propagates any kind of error
fn main() -> Result<(), Box<dyn Error>> {
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
            // Constructing paths used for storing the applications data
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
        .build(generate_context!())?
        .run(|application, event| if let RunEvent::ExitRequested { .. } = event {
            // Gets the paths for used for the application, and writes the diary to it when the
            // user exists the application
            let (entries_path, ..) = &*application.state::<(PathBuf, PathBuf, PathBuf)>();
            let diary              = application.state::<Mutex<Diary>>();
            let diary              = diary.lock().unwrap();

            // Unwraps used as the program is already exiting so it doesn't
            // matter whether the application crashed or not as this time
            diary.save(entries_path).unwrap()
        });

    Ok(())
}
