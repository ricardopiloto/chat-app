use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

#[derive(Debug)]
pub struct ApiError {
    pub status: StatusCode,
    pub message: String,
    pub code: Option<String>,
}

impl ApiError {
    pub fn new(status: StatusCode, message: impl Into<String>) -> Self {
        Self {
            status,
            message: message.into(),
            code: None,
        }
    }

    pub fn bad_request(message: impl Into<String>) -> Self {
        Self::new(StatusCode::BAD_REQUEST, message)
    }

    pub fn unauthorized() -> Self {
        Self::new(StatusCode::UNAUTHORIZED, "unauthorized")
    }

    pub fn forbidden(message: impl Into<String>) -> Self {
        Self::new(StatusCode::FORBIDDEN, message)
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        Self::new(StatusCode::NOT_FOUND, message)
    }

    pub fn conflict(message: impl Into<String>) -> Self {
        Self::new(StatusCode::CONFLICT, message)
    }

    pub fn conflict_code(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::CONFLICT,
            message: message.into(),
            code: Some(code.into()),
        }
    }

    pub fn service_unavailable(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::SERVICE_UNAVAILABLE,
            message: message.into(),
            code: Some(code.into()),
        }
    }

    pub fn gone(message: impl Into<String>) -> Self {
        Self::new(StatusCode::GONE, message)
    }

    pub fn internal(message: impl Into<String>) -> Self {
        tracing::error!("internal error: {}", message.into());
        Self::new(StatusCode::INTERNAL_SERVER_ERROR, "internal error")
    }
}

#[derive(Serialize)]
struct ErrorBody {
    error: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    code: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    message: Option<String>,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        tracing::warn!(status = %self.status, error = %self.message, "request error");
        let body = if let Some(code) = self.code.clone() {
            ErrorBody {
                error: code,
                code: self.code,
                message: Some(self.message),
            }
        } else {
            ErrorBody {
                error: self.message,
                code: None,
                message: None,
            }
        };
        (self.status, Json(body)).into_response()
    }
}

impl From<sqlx::Error> for ApiError {
    fn from(err: sqlx::Error) -> Self {
        if let sqlx::Error::Database(db) = &err {
            if db.is_unique_violation() {
                return ApiError::conflict("already exists");
            }
        }
        ApiError::internal(err.to_string())
    }
}
