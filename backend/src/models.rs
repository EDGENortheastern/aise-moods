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
