use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct KeyEnvelope {
    pub server_id: Uuid,
    pub account_id: Uuid,
    pub sealed_key: Vec<u8>,
    pub sealed_by_account_id: Uuid,
}
