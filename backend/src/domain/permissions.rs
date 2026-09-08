use crate::domain::channel::{Channel, ChannelType, ChannelVisibility};
use crate::domain::channel_acl::{AclEffect, AclSubjectType, ChannelAclEntry, PermLevel};
use crate::domain::server_role::{RoleCapabilities, DONO_POSITION, NO_ROLE_POSITION};
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EffectiveAccess {
    pub view: bool,
    pub level: Option<PermLevel>,
}

impl EffectiveAccess {
    pub const NONE: Self = Self {
        view: false,
        level: None,
    };
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct AccessFactor {
    pub layer: String,
    pub detail: String,
}

#[derive(Debug, Clone)]
pub struct AccessDecision {
    pub access: EffectiveAccess,
    pub factors: Vec<AccessFactor>,
}

impl AccessDecision {
    pub fn none(detail: impl Into<String>) -> Self {
        Self {
            access: EffectiveAccess::NONE,
            factors: vec![AccessFactor {
                layer: "base".into(),
                detail: detail.into(),
            }],
        }
    }
}

/// Owner always ranks above everyone; no role → bottom.
pub fn effective_position(is_owner: bool, role_position: Option<i64>) -> i64 {
    if is_owner {
        i64::MAX
    } else {
        role_position.unwrap_or(NO_ROLE_POSITION)
    }
}

pub fn can_moderate_member(actor_pos: i64, target_pos: i64, actor_is_owner: bool) -> bool {
    actor_is_owner || actor_pos > target_pos
}

/// Non-owner may only manage roles strictly below their position.
pub fn can_manage_role_target(
    actor_pos: i64,
    target_role_pos: i64,
    actor_is_owner: bool,
    target_is_system: bool,
) -> bool {
    if target_is_system && !actor_is_owner {
        return false;
    }
    actor_is_owner || actor_pos > target_role_pos
}

fn maximum_level(channel: &Channel) -> PermLevel {
    match channel.kind {
        ChannelType::Text => PermLevel::Write,
        ChannelType::VoiceVideo => PermLevel::Speak,
    }
}

fn view_level(channel: &Channel) -> PermLevel {
    match channel.kind {
        ChannelType::Text => PermLevel::Read,
        ChannelType::VoiceVideo => PermLevel::Listen,
    }
}

fn level_compatible(channel: &Channel, level: PermLevel) -> bool {
    matches!(
        (channel.kind, level),
        (ChannelType::Text, PermLevel::Read | PermLevel::Write)
            | (
                ChannelType::VoiceVideo,
                PermLevel::Listen | PermLevel::Speak
            )
    )
}

fn downgrade_level(channel: &Channel) -> PermLevel {
    view_level(channel)
}

/// Apply one overwrite entry onto mutable view/level state.
fn apply_overwrite(
    channel: &Channel,
    view: &mut bool,
    level: &mut Option<PermLevel>,
    entry: &ChannelAclEntry,
) {
    if !level_compatible(channel, entry.level) {
        return;
    }
    match entry.effect {
        AclEffect::Deny => {
            if entry.level.is_view_level() {
                // Deny view — only meaningful for private (caller validates public).
                *view = false;
                *level = None;
            } else if entry.level.is_action_level() {
                if *view {
                    *level = Some(downgrade_level(channel));
                }
            }
        }
        AclEffect::Allow => {
            *view = true;
            *level = Some(match *level {
                Some(cur) => cur.max(entry.level),
                None => entry.level,
            });
        }
    }
}

fn entries_for_subject<'a>(
    entries: &'a [ChannelAclEntry],
    subject_type: AclSubjectType,
    subject_id: Option<Uuid>,
) -> Vec<&'a ChannelAclEntry> {
    entries
        .iter()
        .filter(|e| {
            e.subject_type == subject_type
                && match subject_id {
                    Some(id) => e.subject_id == id,
                    None => true,
                }
        })
        .collect()
}

/// Resolve channel access with overwrite stack (FR-005).
pub fn resolve_channel_access(
    channel: &Channel,
    is_owner: bool,
    is_member: bool,
    _caps: &RoleCapabilities,
    member_role_id: Option<Uuid>,
    overwrites: &[ChannelAclEntry],
) -> AccessDecision {
    if !is_member {
        return AccessDecision::none("Sem membership no servidor");
    }

    let maximum = maximum_level(channel);
    let mut factors = Vec::new();

    if is_owner {
        factors.push(AccessFactor {
            layer: "owner".into(),
            detail: "Dono do servidor — acesso pleno".into(),
        });
        return AccessDecision {
            access: EffectiveAccess {
                view: true,
                level: Some(maximum),
            },
            factors,
        };
    }

    // Base from visibility only; level filled after overwrites if still unset.
    let mut view = match channel.visibility {
        ChannelVisibility::Public => true,
        ChannelVisibility::Private => false,
    };
    let mut level: Option<PermLevel> = None;

    factors.push(AccessFactor {
        layer: "base".into(),
        detail: match channel.visibility {
            ChannelVisibility::Public => "Canal público — visível a membros".into(),
            ChannelVisibility::Private => "Canal privado — sem acesso até Allow".into(),
        },
    });

    // Layer: everyone
    let everyone = entries_for_subject(overwrites, AclSubjectType::Everyone, None);
    if everyone.is_empty() {
        factors.push(AccessFactor {
            layer: "everyone".into(),
            detail: "Sem overwrite «todos»".into(),
        });
    } else {
        for e in &everyone {
            apply_overwrite(channel, &mut view, &mut level, e);
            factors.push(AccessFactor {
                layer: "everyone".into(),
                detail: format!("{} {}", e.effect.as_str(), e.level.as_str()),
            });
        }
    }

    // Layer: role
    if let Some(role_id) = member_role_id {
        let role_ow = entries_for_subject(overwrites, AclSubjectType::Role, Some(role_id));
        if role_ow.is_empty() {
            factors.push(AccessFactor {
                layer: "role".into(),
                detail: "Sem overwrite de perfil".into(),
            });
        } else {
            for e in &role_ow {
                apply_overwrite(channel, &mut view, &mut level, e);
                factors.push(AccessFactor {
                    layer: "role".into(),
                    detail: format!("{} {}", e.effect.as_str(), e.level.as_str()),
                });
            }
        }
    } else {
        factors.push(AccessFactor {
            layer: "role".into(),
            detail: "Membro sem perfil".into(),
        });
    }

    // Note: member account overwrites applied by caller passing account-specific filter —
    // we apply all account entries for this account_id via member_overwrites parameter pattern.
    // Here `overwrites` already filtered OR we filter Account by matching all and let caller
    // pass only relevant — actually full channel list: filter Account where subject matches
    // is done below if we get account_id. Add account_id param.

    AccessDecision {
        access: EffectiveAccess {
            view,
            level,
        },
        factors,
    }
}

/// Full resolve including member overwrite layer + cap intersection.
pub fn resolve_channel_access_for_member(
    channel: &Channel,
    is_owner: bool,
    is_member: bool,
    account_id: Uuid,
    caps: &RoleCapabilities,
    member_role_id: Option<Uuid>,
    overwrites: &[ChannelAclEntry],
) -> AccessDecision {
    let mut decision = resolve_channel_access(
        channel,
        is_owner,
        is_member,
        caps,
        member_role_id,
        overwrites,
    );
    if is_owner || !is_member {
        return decision;
    }

    let mut view = decision.access.view;
    let mut level = decision.access.level;

    let member_ow = entries_for_subject(overwrites, AclSubjectType::Account, Some(account_id));
    if member_ow.is_empty() {
        decision.factors.push(AccessFactor {
            layer: "member".into(),
            detail: "Sem overwrite de membro".into(),
        });
    } else {
        for e in &member_ow {
            apply_overwrite(channel, &mut view, &mut level, e);
            decision.factors.push(AccessFactor {
                layer: "member".into(),
                detail: format!("{} {}", e.effect.as_str(), e.level.as_str()),
            });
        }
    }

    // Cap intersection for send/speak (Deny already applied; Allow cannot bypass missing caps).
    if view && level.is_none() {
        level = Some(match channel.kind {
            ChannelType::Text => {
                if caps.can_send_messages {
                    PermLevel::Write
                } else {
                    PermLevel::Read
                }
            }
            ChannelType::VoiceVideo => {
                if caps.can_speak_voice {
                    PermLevel::Speak
                } else {
                    PermLevel::Listen
                }
            }
        });
        decision.factors.push(AccessFactor {
            layer: "base".into(),
            detail: "Nível por defeito do perfil".into(),
        });
    }

    if view {
        match channel.kind {
            ChannelType::Text => {
                if matches!(level, Some(PermLevel::Write)) && !caps.can_send_messages {
                    level = Some(PermLevel::Read);
                    decision.factors.push(AccessFactor {
                        layer: "caps".into(),
                        detail: "Perfil sem enviar mensagens — nível reduzido".into(),
                    });
                } else {
                    decision.factors.push(AccessFactor {
                        layer: "caps".into(),
                        detail: if caps.can_send_messages {
                            "Perfil pode enviar mensagens".into()
                        } else {
                            "Perfil sem enviar mensagens".into()
                        },
                    });
                }
            }
            ChannelType::VoiceVideo => {
                if matches!(level, Some(PermLevel::Speak)) && !caps.can_speak_voice {
                    level = Some(PermLevel::Listen);
                    decision.factors.push(AccessFactor {
                        layer: "caps".into(),
                        detail: "Perfil sem falar — nível reduzido".into(),
                    });
                } else if !caps.can_connect_voice {
                    view = false;
                    level = None;
                    decision.factors.push(AccessFactor {
                        layer: "caps".into(),
                        detail: "Perfil sem ligar à voz".into(),
                    });
                } else {
                    decision.factors.push(AccessFactor {
                        layer: "caps".into(),
                        detail: "Perfil pode ligar/falar conforme caps".into(),
                    });
                }
            }
        }
    }

    // Public channels never lose view via overwrite (FR-004a).
    if channel.visibility == ChannelVisibility::Public {
        view = true;
        if level.is_none() {
            level = Some(view_level(channel));
        }
    }

    decision.access = if view {
        EffectiveAccess {
            view: true,
            level: level.or(Some(view_level(channel))),
        }
    } else {
        EffectiveAccess::NONE
    };
    decision
}

/// Legacy helper — prefer `resolve_channel_access_for_member`.
pub fn effective_channel_access(
    channel: &Channel,
    is_owner: bool,
    is_creator: bool,
    is_member: bool,
    grants: &[PermLevel],
) -> EffectiveAccess {
    if !is_member {
        return EffectiveAccess::NONE;
    }

    let maximum = maximum_level(channel);
    if is_owner {
        return EffectiveAccess {
            view: true,
            level: Some(maximum),
        };
    }

    let compatible = grants
        .iter()
        .copied()
        .filter(|level| level_compatible(channel, *level))
        .max_by_key(|level| level.rank());

    let view = match channel.visibility {
        ChannelVisibility::Private => is_creator || compatible.is_some(),
        ChannelVisibility::Public => true,
    };
    if !view {
        return EffectiveAccess::NONE;
    }

    EffectiveAccess {
        view: true,
        level: compatible.or(Some(maximum)),
    }
}

pub fn can_create_channel(is_owner: bool, role_can_create: bool) -> bool {
    is_owner || role_can_create
}

/// Legacy: owner or channel creator only (no manage_channels).
pub fn can_manage_channel_acl(is_owner: bool, is_creator: bool) -> bool {
    is_owner || is_creator
}

/// Unified channel management gate (ACL / rename / delete / inspect).
/// Owner or creator always; else `can_manage_channels` with `actor_pos > creator_pos`.
pub fn can_manage_channel(
    is_owner: bool,
    is_creator: bool,
    can_manage_channels: bool,
    actor_pos: i64,
    creator_pos: i64,
) -> bool {
    if is_owner || is_creator {
        return true;
    }
    can_manage_channels && actor_pos > creator_pos
}

/// FR-010(b): non-owner/non-creator may only target subjects strictly below them.
pub fn can_acl_overwrite_subject(
    is_owner: bool,
    is_creator: bool,
    actor_pos: i64,
    subject_pos: i64,
) -> bool {
    if is_owner || is_creator {
        return true;
    }
    actor_pos > subject_pos
}

/// Rename/patch uses the same unified gate as ACL (hierarchy included).
pub fn can_rename_channel(
    is_owner: bool,
    is_creator: bool,
    can_manage_channels: bool,
    actor_pos: i64,
    creator_pos: i64,
) -> bool {
    can_manage_channel(
        is_owner,
        is_creator,
        can_manage_channels,
        actor_pos,
        creator_pos,
    )
}

pub fn can_write_text(access: EffectiveAccess) -> bool {
    access.view && matches!(access.level, Some(PermLevel::Write))
}

pub fn can_listen_voice(access: EffectiveAccess) -> bool {
    access.view && matches!(access.level, Some(PermLevel::Listen | PermLevel::Speak))
}

pub fn can_speak_voice(access: EffectiveAccess) -> bool {
    access.view && matches!(access.level, Some(PermLevel::Speak))
}

pub fn is_server_owner(owner_account_id: Uuid, account_id: Uuid) -> bool {
    owner_account_id == account_id
}

pub fn is_channel_admin(server_owner_id: Uuid, account_id: Uuid) -> bool {
    is_server_owner(server_owner_id, account_id)
}

pub fn can_activate_scene(server_owner_id: Uuid, account_id: Uuid, _is_co_director: bool) -> bool {
    is_channel_admin(server_owner_id, account_id)
}

pub fn can_delete_text_message(
    caller_id: Uuid,
    sender_account_id: Uuid,
    channel_created_by: Uuid,
    server_owner_id: Uuid,
    role_can_delete_others: bool,
) -> bool {
    caller_id == sender_account_id
        || caller_id == channel_created_by
        || is_server_owner(server_owner_id, caller_id)
        || role_can_delete_others
}

pub fn effective_role_caps(
    is_owner: bool,
    aggregated: crate::domain::server_role::RoleCapabilities,
) -> crate::domain::server_role::RoleCapabilities {
    if is_owner {
        crate::domain::server_role::RoleCapabilities::owner_all()
    } else {
        aggregated
    }
}

#[allow(dead_code)]
pub fn dono_position() -> i64 {
    DONO_POSITION
}
