use chat_backend::{api::voice, build_state, config::Config, router};
use chat_backend::{api::auth::recovery, db};
use chrono::{Duration, Utc};
use sqlx::Connection;
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
    let args: Vec<String> = std::env::args().skip(1).collect();
    if !args.is_empty() {
        if args.first().map(String::as_str) != Some("reset-code") || args.len() < 2 || args.len() > 4 {
            eprintln!("usage: chat-backend reset-code <handle> [--ttl-minutes N]");
            std::process::exit(2);
        }
        let ttl_minutes = if args.len() == 4 && args[2] == "--ttl-minutes" {
            match args[3].parse::<i64>() { Ok(n) if (1..=1440).contains(&n) => n, _ => { eprintln!("TTL must be 1..1440 minutes"); std::process::exit(2); } }
        } else if args.len() == 2 { 30 } else { eprintln!("usage: chat-backend reset-code <handle> [--ttl-minutes N]"); std::process::exit(2); };
        if let Err(err) = issue_reset_code(&config, &args[1], ttl_minutes).await {
            eprintln!("{err}");
            std::process::exit(1);
        }
        return;
    }
    let bind = config.bind.clone();
    let state = build_state(config).await.expect("database");
    voice::spawn_stale_occupancy_sweeper(state.clone());
    let app = router(state).layer(tower_http::trace::TraceLayer::new_for_http());
    let listener = TcpListener::bind(&bind).await.expect("bind");
    tracing::info!("listening on {bind}");
    axum::serve(listener, app).await.expect("serve");
}

async fn issue_reset_code(config: &Config, handle: &str, ttl_minutes: i64) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let pool = db::bootstrap(config).await?;
    let mut conn = pool.acquire().await?;
    let mut tx = conn.begin_with("BEGIN IMMEDIATE").await?;
    let account = db::account::find_by_handle(&mut *tx, handle.trim()).await?.ok_or("handle not found")?;
    let code = recovery::generate_code();
    let code_hash = recovery::hash_code(&code).ok_or("code generation failed")?;
    let expiry = Utc::now() + Duration::minutes(ttl_minutes);
    sqlx::query("INSERT OR REPLACE INTO password_reset (id, account_id, code_hash, expires_at, attempts, used_at, created_at) VALUES (?, ?, ?, ?, 0, NULL, ?)")
        .bind(uuid::Uuid::new_v4().to_string()).bind(account.id.to_string()).bind(code_hash)
        .bind(expiry.to_rfc3339()).bind(Utc::now().to_rfc3339()).execute(&mut *tx).await?;
    tx.commit().await?;
    println!("Reset code: {}\nValid until: {}", recovery::format_code(&code), expiry.to_rfc3339());
    Ok(())
}
