use mongodb::bson::oid::ObjectId;
use serde::{Deserialize, Serialize};

/// A user stored in the `users` collection.
#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    /// MongoDB document id (stored as `_id`).
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,

    pub email: String,

    /// The hashed password. Never store or return the plain password.
    pub password_hash: String,
}

/// A single mood entry in the `moods` collection.
#[derive(Debug, Serialize, Deserialize)]
pub struct Mood {
    /// MongoDB document id (stored as `_id`).
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,

    /// Email of the user who logged this mood.
    pub user_email: String,

    /// The chosen mood, e.g. "great", "good", "okay", "low", "awful".
    pub mood: String,

    /// Optional free-text note (empty string when none).
    pub note: String,

    /// When it was logged, as Unix milliseconds.
    pub created_at: i64,
}
