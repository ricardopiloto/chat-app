use crate::config::Config;
use chrono::{DateTime, NaiveDateTime, Utc};
use sqlx::{
    sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions},
    SqlitePool,
};
use std::str::FromStr;

pub mod account;
pub mod attachment;
pub mod channel;
pub mod channel_key;
pub mod channel_role;
pub mod e2ee_audit;
pub mod grid;
pub mod invite;
pub mod key_envelope;
pub mod membership;
pub mod message;
pub mod recording;
pub mod scene;
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

pub fn parse_time(value: &str) -> Result<DateTime<Utc>, sqlx::Error> {
    if let Ok(dt) = DateTime::parse_from_rfc3339(value) {
        return Ok(dt.with_timezone(&Utc));
    }
    let naive = NaiveDateTime::parse_from_str(value, "%Y-%m-%d %H:%M:%S")
        .or_else(|_| NaiveDateTime::parse_from_str(value, "%Y-%m-%dT%H:%M:%S"))
        .or_else(|_| NaiveDateTime::parse_from_str(value, "%Y-%m-%d %H:%M:%S%.f"))
        .map_err(|e| sqlx::Error::Decode(Box::new(e)))?;
    Ok(naive.and_utc())
}
