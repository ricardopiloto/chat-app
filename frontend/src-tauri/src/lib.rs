use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_websocket::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            // WebKitGTK has no certificate interstitial. `tauri dev` loads Vite's self-signed
            // certificate, so debug builds on Linux accept that error and reload once.
            // Release builds load frontend/dist over Tauri's own scheme and do not do this.
            #[cfg(all(debug_assertions, target_os = "linux"))]
            if let Some(window) = app.get_webview_window("main") {
                accept_vite_dev_certificate(&window)?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}

#[cfg(all(debug_assertions, target_os = "linux"))]
fn accept_vite_dev_certificate(window: &tauri::WebviewWindow) -> tauri::Result<()> {
    use webkit2gtk::{WebContextExt, WebViewExt, WebsiteDataManagerExt};
    window.with_webview(|webview| {
        let view = webview.inner();
        #[allow(deprecated)]
        if let Some(context) = view.context() {
            context.set_tls_errors_policy(webkit2gtk::TLSErrorsPolicy::Ignore);
        }
        if let Some(manager) = view.website_data_manager() {
            manager.set_tls_errors_policy(webkit2gtk::TLSErrorsPolicy::Ignore);
        }
        view.reload();
    })
}
