use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

async fn voice_channel(app: &TestApp, alice: &str) -> (String, String) {
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(alice),
        )
        .await;
    let server_id = server["id"].as_str().unwrap().to_string();
    let (_, ch, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({
                "name": "mesa",
                "type": "voice_video",
                "custody_ack": true,
                "channel_key_sealed": "c2VhbGVkLWNoYW5uZWwta2V5LWJsb2I="
            })),
            Some(alice),
        )
        .await;
    (server_id, ch["id"].as_str().unwrap().to_string())
}

fn empty_slots(n: i64) -> Vec<serde_json::Value> {
    (0..n)
        .map(|i| json!({ "index": i, "account_id": null }))
        .collect()
}

#[tokio::test]
async fn accepts_mestre_six_and_faixa_three() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (_, channel_id) = voice_channel(&app, &alice).await;

    let (_, created, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/scenes"),
            Some(json!({ "name": "Variavel" })),
            Some(&alice),
        )
        .await;
    let scene_id = created["id"].as_str().unwrap();

    let (status, patched, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{channel_id}/scenes/{scene_id}"),
            Some(json!({
                "layout": {
                    "layout_key": "mestre",
                    "slot_count": 6,
                    "assigned_by": "owner",
                    "slots": empty_slots(6)
                }
            })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{patched}");
    assert_eq!(patched["layout"]["slot_count"], 6);
    assert_eq!(patched["layout"]["layout_key"], "mestre");
    assert_eq!(patched["layout"]["slots"].as_array().unwrap().len(), 6);

    let (status, patched, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{channel_id}/scenes/{scene_id}"),
            Some(json!({
                "layout": {
                    "layout_key": "faixa",
                    "slot_count": 3,
                    "assigned_by": "owner",
                    "slots": empty_slots(3)
                }
            })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{patched}");
    assert_eq!(patched["layout"]["slot_count"], 3);
    assert_eq!(patched["layout"]["layout_key"], "faixa");
}

#[tokio::test]
async fn rejects_slot_count_out_of_range_and_length_mismatch() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (_, channel_id) = voice_channel(&app, &alice).await;

    let (_, created, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/scenes"),
            Some(json!({ "name": "Bounds" })),
            Some(&alice),
        )
        .await;
    let scene_id = created["id"].as_str().unwrap();

    for bad_n in [1_i64, 9_i64] {
        let (status, body, _) = app
            .request(
                "PATCH",
                &format!("/api/channels/{channel_id}/scenes/{scene_id}"),
                Some(json!({
                    "layout": {
                        "layout_key": "quad",
                        "slot_count": bad_n,
                        "assigned_by": "owner",
                        "slots": empty_slots(bad_n)
                    }
                })),
                Some(&alice),
            )
            .await;
        assert_eq!(status, StatusCode::BAD_REQUEST, "n={bad_n} body={body}");
    }

    let (status, body, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{channel_id}/scenes/{scene_id}"),
            Some(json!({
                "layout": {
                    "layout_key": "mestre",
                    "slot_count": 6,
                    "assigned_by": "owner",
                    "slots": empty_slots(5)
                }
            })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{body}");
}

#[tokio::test]
async fn put_grid_accepts_variable_n() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (_, channel_id) = voice_channel(&app, &alice).await;

    let (status, grid, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{channel_id}/grid"),
            Some(json!({
                "layout_key": "mestre",
                "slot_count": 6,
                "assigned_by": "owner",
                "slots": empty_slots(6)
            })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{grid}");
    assert_eq!(grid["slot_count"], 6);
    assert_eq!(grid["layout_key"], "mestre");
}
