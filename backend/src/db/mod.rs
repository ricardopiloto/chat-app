use crate::config::Config;
use sqlx::{
    sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions},
    SqlitePool,
};
use std::str::FromStr;

pub mod account;
pub mod channel;
pub mod grid;
pub mod invite;
pub mod key_envelope;
pub mod membership;
pub mod message;
pub mod server;
pub mod session;

pub async fn connect(database_url: &str) -> Result<SqlitePool, sqlx::Error> {
    let options = SqliteConnectOptions::from_str(database_url)?
        .create_if_missing(true)
        .foreign_keys(true)
        .journal_mode(SqliteJournalMode::Wal);
    SqlitePoolOptions::new()
        .max_connections(8)
        .connect_with(options)
        .await
}

pub async fn migrate(pool: &SqlitePool) -> Result<(), sqlx::migrate::MigrateError> {
    sqlx::migrate!("./migrations").run(pool).await
}

pub async fn bootstrap(config: &Config) -> Result<SqlitePool, Box<dyn std::error::Error + Send + Sync>> {
    let pool = connect(&config.database_url).await?;
    migrate(&pool).await?;
    Ok(pool)
}
