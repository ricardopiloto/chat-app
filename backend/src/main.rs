use chat_backend::{api::voice, build_state, config::Config, router};
use tokio::net::TcpListener;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
            "chat_backend=info,tower_http=info,axum=info".into()
        }))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = Config::from_env();
    if let Err(msg) = config.validate() {
        tracing::error!("{msg}");
        std::process::exit(1);
    }
    let bind = config.bind.clone();
    let state = build_state(config).await.expect("database");
    voice::spawn_stale_occupancy_sweeper(state.clone());
    let app = router(state).layer(tower_http::trace::TraceLayer::new_for_http());
    let listener = TcpListener::bind(&bind).await.expect("bind");
    tracing::info!("listening on {bind}");
    axum::serve(listener, app).await.expect("serve");
}
