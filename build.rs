// Imports

use std::{
	io::Result,
	process::Command,
};
use tauri_build::build;

// Main

fn main() -> Result<()> {
	//#[cfg(target_os = "windows")] Command::new("convert").args([
	//	"-density",
	//	"300",
	//	"icon:auto-resize=256,128,96,64,48,32,16",
	//	"-background",
	//	"none",
	//	"design/logo.svg",
	//	"target/icon.ico",
	//]).output()?;
	//#[cfg(target_os = "linux")] Command::new("convert").args([
	//	"-density",
	//	"300",
	//	"icon:auto-resize=256,128,96,64,48,32,16",
	//	"-background",
	//	"none",
	//	"design/logo.svg",
	//	"target/icon.png",
	//]).output()?;

	build();

	Ok(())
}
