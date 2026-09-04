use uuid::Uuid;

pub fn is_server_owner(owner_account_id: Uuid, account_id: Uuid) -> bool {
    owner_account_id == account_id
}

/// Fase 1: admin de canal = dono do Servidor (sem tabela extra de papéis).
pub fn is_channel_admin(server_owner_id: Uuid, account_id: Uuid) -> bool {
    is_server_owner(server_owner_id, account_id)
}

/// Co-diretor is deferred (fase 005): only the server owner may activate scenes.
pub fn can_activate_scene(server_owner_id: Uuid, account_id: Uuid, _is_co_director: bool) -> bool {
    is_channel_admin(server_owner_id, account_id)
}
