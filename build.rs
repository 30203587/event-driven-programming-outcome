// Imports

use std::process::Command;
use tauri_build::build;

// Main

fn main() {
    // SVG converted to different formats based on target platform, underscore
    // assignment to ignore result if ImageMagick can't be used, allowing manual
    // format conversion if required
    if cfg!(target_os = "windows") {
        _ = Command::new("convert").args([
            "-density",
            "300",
            "icon:auto-resize=256,128,96,64,48,32,16",
            "-background",
            "none",
            "frontend/logo.svg",
            "target/icon.ico",
        ]).output();
    }
    if cfg!(target_os = "linux") {
        _ = Command::new("convert").args([
            "-density",
            "300",
            "icon:auto-resize=256,128,96,64,48,32,16",
            "-background",
            "none",
            "frontend/logo.svg",
            "target/icon.png",
        ]).output();
    }

    build()
}
