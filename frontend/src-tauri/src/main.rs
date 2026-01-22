// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;

use tauri::{Manager, RunEvent};

#[derive(Default)]
struct BackendProcess(Mutex<Option<Child>>);

/// Resolve backend working directory relative to the executable.
/// In dev: from src-tauri/target/debug -> ../../backend/src
/// In production: backend is bundled as resource next to executable.
fn backend_dir() -> Option<PathBuf> {
    let exe_dir = std::env::current_exe().ok()?.parent()?.to_path_buf();

    // Try production path first (bundled resources)
    let prod_candidate = exe_dir.join("backend").join("src");
    if prod_candidate.join("main.py").exists() {
        return Some(prod_candidate);
    }

    // Fallback to dev path
    let dev_candidate = exe_dir
        .join("..")
        .join("..")
        .join("backend")
        .join("src");

    if dev_candidate.join("main.py").exists() {
        Some(dev_candidate)
    } else {
        eprintln!("Backend not found at {:?} or {:?}", prod_candidate, dev_candidate);
        None
    }
}

/// Spawn the Python backend without opening a console window.
fn spawn_backend() -> Option<Child> {
    let workdir = backend_dir();

    // Try Python 3.12 specifically via launcher, fallback to generic python
    let python_cmd = if Command::new("py").arg("-3.12").arg("--version").output().is_ok() {
        vec!["py", "-3.12"]
    } else if Command::new("python3.12").arg("--version").output().is_ok() {
        vec!["python3.12"]
    } else {
        vec!["python"]
    };

    let mut cmd = Command::new(python_cmd[0]);
    if python_cmd.len() > 1 {
        cmd.arg(python_cmd[1]);
    }
    cmd.arg("main.py")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    if let Some(dir) = workdir {
        cmd.current_dir(dir);
    }

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
