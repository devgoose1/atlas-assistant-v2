// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Child, Command, Stdio};
use std::sync::Mutex;

use tauri::{Manager, RunEvent};

#[derive(Default)]
struct BackendProcess(Mutex<Option<Child>>);

/// Spawn the Python backend without opening a console window.
fn spawn_backend() -> Option<Child> {
    // Backend entry lives in ../backend/src/main.py relative to src-tauri
    let mut cmd = Command::new("python");
    cmd.arg("main.py")
        .current_dir("../backend/src")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    #[cfg(windows)]
    {
        // Hide console window on Windows
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    match cmd.spawn() {
        Ok(child) => Some(child),
        Err(err) => {
            eprintln!("Failed to start backend: {err}");
            None
        }
    }
}

fn main() {
    let app = tauri::Builder::default()
        .manage(BackendProcess::default())
        .setup(|app| {
            let state = app.state::<BackendProcess>();
            let mut guard = state.0.lock().expect("backend mutex poisoned");
            *guard = spawn_backend();
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(|app_handle, event| {
        if let RunEvent::ExitRequested { .. } | RunEvent::Exit { .. } = event {
            let state = app_handle.state::<BackendProcess>();
            if let Some(mut child) = state.0.lock().ok().and_then(|mut c| c.take()) {
                let _ = child.kill();
            }
        }
    });
}
