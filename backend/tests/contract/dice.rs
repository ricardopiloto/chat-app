use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

#[tokio::test]
async fn dice_channel_acl_rolls_and_last_channel() {
    let app = TestApp::new().await;
    let (_, owner, cookie) = app.register("diceowner", "password1", None).await;
    let cookie = must_cookie(cookie);
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&cookie),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();
    let (status, dice, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({"name":"dados","type":"dice"})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{dice}");
    assert_eq!(dice["e2ee_enabled"], false);
    assert_eq!(dice["has_channel_key"], false);
    let id = dice["id"].as_str().unwrap();
    let (status, _, _) = app.request("PUT", &format!("/api/channels/{id}/read"), Some(json!({})), Some(&cookie)).await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    let (status, _, _) = app.request(
        "PATCH", &format!("/api/channels/{id}"),
        Some(json!({"name":"changed", "visibility":"private", "dice_animations_enabled":true})),
        Some(&cookie),
    ).await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    let (_, unchanged, _) = app.request("GET", &format!("/api/channels/{id}"), None, Some(&cookie)).await;
    assert_eq!(unchanged["name"], "dados");
    assert_eq!(unchanged["visibility"], "public");
    assert_eq!(unchanged["dice_animations_enabled"], false);
    let (_, invite, _) = app.request("POST", &format!("/api/servers/{server_id}/invites"), Some(json!({})), Some(&cookie)).await;
    let (_, member_account, member_cookie) = app.register("dicemember", "password1", Some(invite["code"].as_str().unwrap())).await;
    let member_cookie = must_cookie(member_cookie);
    let (status, member_roll, _) = app.request("POST", &format!("/api/channels/{id}/dice"), Some(json!({"notation":"1d6"})), Some(&member_cookie)).await;
    assert_eq!(status, StatusCode::CREATED, "{member_roll}");
    let (status, _, _) = app.request("PUT", &format!("/api/channels/{id}/mutes/{}", member_account["id"].as_str().unwrap()), Some(json!({"duration_minutes": 5})), Some(&cookie)).await;
    assert_eq!(status, StatusCode::OK);
    let (status, _, _) = app.request("POST", &format!("/api/channels/{id}/dice"), Some(json!({"notation":"1d6"})), Some(&member_cookie)).await;
    assert_eq!(status, StatusCode::FORBIDDEN);
    let (status, err, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{id}"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CONFLICT);
    assert_eq!(err["error"], "last_channel_of_type");
    assert!(err["message"].as_str().unwrap_or("").contains("dice"));
    let (status, _, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{id}/acl"),
            Some(json!([{"subject_type":"everyone","level":"read"}])),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let (status, _, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{id}/acl"),
            Some(json!([{"subject_type":"everyone","level":"write"}])),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    for level in ["listen", "speak"] {
        let (status, _, _) = app
            .request(
                "PUT",
                &format!("/api/channels/{id}/acl"),
                Some(json!([{"subject_type":"everyone","level":level}])),
                Some(&cookie),
            )
            .await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
    }
    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/channels/{id}/messages"),
            Some(json!({"content_ciphertext":"aGVsbG8="})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    for notation in ["1d20", "2d6+3"] {
        let (status, roll, _) = app
            .request(
                "POST",
                &format!("/api/channels/{id}/dice"),
                Some(json!({"notation":notation})),
                Some(&cookie),
            )
            .await;
        assert_eq!(status, StatusCode::CREATED, "{roll}");
        assert_eq!(roll["kind"], "dice_roll");
        assert_eq!(roll["sender_account_id"], owner["id"]);
        let payload: serde_json::Value =
            serde_json::from_str(roll["content_plaintext"].as_str().unwrap()).unwrap();
        assert_eq!(payload["notation"], notation);
        assert_eq!(
            payload["rolls"].as_array().unwrap().len(),
            notation.chars().next().unwrap().to_digit(10).unwrap() as usize
        );
        assert!(payload.get("faces").is_none() || payload["faces"].is_null());
    }
    {
        let (status, roll, _) = app
            .request(
                "POST",
                &format!("/api/channels/{id}/dice"),
                Some(json!({"notation":"1d100+2"})),
                Some(&cookie),
            )
            .await;
        assert_eq!(status, StatusCode::CREATED, "{roll}");
        let payload: serde_json::Value =
            serde_json::from_str(roll["content_plaintext"].as_str().unwrap()).unwrap();
        assert_eq!(payload["notation"], "1d100+2");
        assert_eq!(payload["sides"], 100);
        assert_eq!(payload["modifier"], 2);
        let rolls = payload["rolls"].as_array().unwrap();
        assert_eq!(rolls.len(), 1);
        let value = rolls[0].as_u64().unwrap();
        assert!((1..=100).contains(&value));
        let faces = payload["faces"].as_array().unwrap();
        assert_eq!(faces.len(), 2);
        let tens = faces[0].as_u64().unwrap();
        let units = faces[1].as_u64().unwrap();
        assert!(matches!(tens, 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100));
        assert!(units <= 9);
        let reconstructed = if tens == 100 { units } else { tens + units };
        let reconstructed = if reconstructed == 0 { 100 } else { reconstructed };
        assert_eq!(reconstructed, value);
        assert_eq!(payload["total"].as_i64().unwrap(), value as i64 + 2);
    }
    {
        let (status, roll, _) = app
            .request(
                "POST",
                &format!("/api/channels/{id}/dice"),
                Some(json!({"notation":"2d100"})),
                Some(&cookie),
            )
            .await;
        assert_eq!(status, StatusCode::CREATED, "{roll}");
        let payload: serde_json::Value =
            serde_json::from_str(roll["content_plaintext"].as_str().unwrap()).unwrap();
        assert_eq!(payload["rolls"].as_array().unwrap().len(), 2);
        assert_eq!(payload["faces"].as_array().unwrap().len(), 4);
    }
    for notation in ["0d20", "21d6", "1d1", "1d1001", "1d20+101", "bad"] {
        let (status, _, _) = app
            .request(
                "POST",
                &format!("/api/channels/{id}/dice"),
                Some(json!({"notation":notation})),
                Some(&cookie),
            )
            .await;
        assert_eq!(status, StatusCode::BAD_REQUEST, "{notation}");
    }
}

#[tokio::test]
async fn text_dice_animation_setting_defaults_and_updates() {
    let app = TestApp::new().await;
    let (_, _, cookie) = app.register("settingowner", "password1", None).await;
    let cookie = must_cookie(cookie);
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&cookie),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();
    let (_, channels, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/channels"),
            None,
            Some(&cookie),
        )
        .await;
    let text = channels
        .as_array()
        .unwrap()
        .iter()
        .find(|c| c["type"] == "text")
        .unwrap();
    assert_eq!(text["dice_animations_enabled"], false);
    let id = text["id"].as_str().unwrap();
    for enabled in [true, false] {
        let (status, updated, _) = app
            .request(
                "PATCH",
                &format!("/api/channels/{id}"),
                Some(json!({"dice_animations_enabled":enabled})),
                Some(&cookie),
            )
            .await;
        assert_eq!(status, StatusCode::OK, "{updated}");
        assert_eq!(updated["dice_animations_enabled"], enabled);
    }
    let (_, created, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({"name":"other","type":"text"})),
            Some(&cookie),
        )
        .await;
    assert_eq!(created["dice_animations_enabled"], false);
}

#[tokio::test]
async fn dice_animation_patch_rejected_on_dice_without_changes() {
    let app = TestApp::new().await;
    let (_, _, cookie) = app.register("settingdice", "password1", None).await;
    let cookie = must_cookie(cookie);
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&cookie),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();
    let (status, dice, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({"name":"dados","type":"dice"})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{dice}");
    let id = dice["id"].as_str().unwrap();

    let (status, error, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{id}"),
            Some(json!({"name":"changed", "visibility":"private", "dice_animations_enabled":true})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{error}");
    let (status, after, _) = app
        .request("GET", &format!("/api/channels/{id}"), None, Some(&cookie))
        .await;
    assert_eq!(status, StatusCode::OK, "{after}");
    assert_eq!(after["name"], dice["name"]);
    assert_eq!(after["visibility"], dice["visibility"]);
    assert_eq!(after["dice_animations_enabled"], dice["dice_animations_enabled"]);
}

#[tokio::test]
async fn dice_animation_patch_rejected_on_voice_before_name() {
    let app = TestApp::new().await;
    let (_, _, cookie) = app.register("settingvoice", "password1", None).await;
    let cookie = must_cookie(cookie);
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&cookie),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();
    let (_, channels, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/channels"),
            None,
            Some(&cookie),
        )
        .await;
    let voice = channels
        .as_array()
        .unwrap()
        .iter()
        .find(|c| c["type"] == "voice_video")
        .unwrap();
    let id = voice["id"].as_str().unwrap();
    let original = voice["name"].clone();
    let (status, _, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{id}"),
            Some(json!({"name":"changed", "visibility":"private", "dice_animations_enabled":true})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    let (_, after, _) = app
        .request("GET", &format!("/api/channels/{id}"), None, Some(&cookie))
        .await;
    assert_eq!(after["name"], original);
    assert_eq!(after["visibility"], "public");
    assert_eq!(after["dice_animations_enabled"], false);
}

#[tokio::test]
async fn ordinary_member_cannot_change_dice_animation_setting() {
    let app = TestApp::new().await;
    let (_, _, cookie) = app.register("settingadmin", "password1", None).await;
    let cookie = must_cookie(cookie);
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&cookie),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();
    let (_, channels, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/channels"),
            None,
            Some(&cookie),
        )
        .await;
    let id = channels
        .as_array()
        .unwrap()
        .iter()
        .find(|c| c["type"] == "text")
        .unwrap()["id"]
        .as_str()
        .unwrap();
    let (_, invite, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&cookie),
        )
        .await;
    let (_, _, member) = app
        .register(
            "settingmember",
            "password1",
            Some(invite["code"].as_str().unwrap()),
        )
        .await;
    let member = must_cookie(member);
    let (status, _, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{id}"),
            Some(json!({"dice_animations_enabled":true})),
            Some(&member),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn text_roll_contract_and_natural_labels() {
    let app = TestApp::new().await;
    let (_, owner, cookie) = app.register("textroller", "password1", None).await;
    let cookie = must_cookie(cookie);
    let (_, server, _) = app.request("POST", "/api/servers", Some(crate::common::create_server_body("Mesa")), Some(&cookie)).await;
    let server_id = server["id"].as_str().unwrap();
    let (_, channels, _) = app.request("GET", &format!("/api/servers/{server_id}/channels"), None, Some(&cookie)).await;
    let id = channels.as_array().unwrap().iter().find(|c| c["type"] == "text").unwrap()["id"].as_str().unwrap();
    let (status, roll, _) = app.request("POST", &format!("/api/channels/{id}/dice"), Some(json!({"notation":"2d6+3","label":"Check"})), Some(&cookie)).await;
    assert_eq!(status, StatusCode::CREATED, "{roll}");
    assert_eq!(roll["kind"], "dice_roll");
    assert_eq!(roll["sender_account_id"], owner["id"]);
    let payload: serde_json::Value = serde_json::from_str(roll["content_plaintext"].as_str().unwrap()).unwrap();
    let total = payload["rolls"].as_array().unwrap().iter().map(|v| v.as_i64().unwrap()).sum::<i64>() + 3;
    assert_eq!(payload["total"], total);
    assert_eq!(payload["natural"], serde_json::Value::Null);
    for _ in 0..250 {
        let (_, roll, _) = app.request("POST", &format!("/api/channels/{id}/dice"), Some(json!({"notation":"1d20"})), Some(&cookie)).await;
        let payload: serde_json::Value = serde_json::from_str(roll["content_plaintext"].as_str().unwrap()).unwrap();
        let face = payload["rolls"][0].as_i64().unwrap();
        assert_eq!(payload["natural"], match face { 20 => json!("critical"), 1 => json!("critical_failure"), _ => serde_json::Value::Null });
    }
}
