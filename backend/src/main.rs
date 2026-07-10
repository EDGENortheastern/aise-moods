mod models;

use axum::{
    extract::{FromRequestParts, State},
    http::{header::AUTHORIZATION, request::Parts, StatusCode},
    routing::{get, post},
    Json, Router,
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use models::{Mood, User};
use mongodb::{bson::doc, Client, Database};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use tower_http::cors::CorsLayer;

// Shared application state passed to route handlers.
#[derive(Clone)]
struct AppState {
    db: Database,
    jwt_secret: String,
}

#[tokio::main]
async fn main() {
    // Load variables from a local .env file if present.
    dotenvy::dotenv().ok();

    // Connect to MongoDB using the connection string from the environment.
    let uri = std::env::var("MONGODB_URI").expect("MONGODB_URI must be set");
    let db_name =
        std::env::var("DATABASE_NAME").unwrap_or_else(|_| "aise_moods".to_string());

    let client = Client::with_uri_str(&uri)
        .await
        .expect("Failed to create MongoDB client");
    let db = client.database(&db_name);

    // Verify the connection with a ping so a bad URI fails fast.
    db.run_command(doc! { "ping": 1 })
        .await
        .expect("Failed to connect to MongoDB");
    println!("Connected to MongoDB database: {db_name}");

    // Secret used to sign and verify login tokens.
    let jwt_secret = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");

    let state = AppState { db, jwt_secret };

    // Allow the React frontend to call this API.
    // Permissive is fine for teaching; tighten to your real origins in production.
    let cors = CorsLayer::permissive();

    // Build the app with a single health check route.
    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health))
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
        .route("/me", get(me))
        .route("/moods", post(create_mood).get(list_moods))
        .layer(cors)
        .with_state(state);

    // Use the PORT from the environment (Render sets this), else 3000 locally.
    // Bind 0.0.0.0 so the server is reachable when deployed.
    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let addr = format!("0.0.0.0:{port}");

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();

    println!("Backend running on http://{addr}");
    axum::serve(listener, app).await.unwrap();
}

// Friendly landing message shown at the root URL.
async fn root() -> &'static str {
    "aise-moods API is running"
}

// Returns a simple OK so we can check the server is alive.
async fn health() -> &'static str {
    "OK"
}

// Validation errors that can occur during registration.
#[derive(Debug, PartialEq)]
enum ValidationError {
    PasswordTooShort,
    PasswordTooLong,
    EmptyEmail,
    EmptyPassword,
    InvalidEmailFormat,
}

impl ValidationError {
    fn message(&self) -> &str {
        match self {
            ValidationError::PasswordTooShort => "Password must be at least 8 characters",
            ValidationError::PasswordTooLong => "Password must not exceed 128 characters",
            ValidationError::EmptyEmail => "Email cannot be empty",
            ValidationError::EmptyPassword => "Password cannot be empty",
            ValidationError::InvalidEmailFormat => "Email must be a valid format",
        }
    }
}

// Validate registration input.
fn validate_registration(email: &str, password: &str) -> Result<(), ValidationError> {
    // Check for empty fields first
    if email.trim().is_empty() {
        return Err(ValidationError::EmptyEmail);
    }
    if password.is_empty() {
        return Err(ValidationError::EmptyPassword);
    }

    // Validate email format (basic check)
    if !email.contains('@') || !email.contains('.') || email.starts_with('@') || email.ends_with('@') {
        return Err(ValidationError::InvalidEmailFormat);
    }

    // Check password length
    if password.len() < 8 {
        return Err(ValidationError::PasswordTooShort);
    }
    if password.len() > 128 {
        return Err(ValidationError::PasswordTooLong);
    }

    Ok(())
}

// The JSON body the client sends to register.
#[derive(Deserialize)]
struct RegisterRequest {
    email: String,
    password: String,
}

// POST /auth/register — create a new user with a hashed password.
async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<StatusCode, (StatusCode, String)> {
    // Validate input first
    if let Err(e) = validate_registration(&payload.email, &payload.password) {
        return Err((StatusCode::BAD_REQUEST, e.message().to_string()));
    }

    let users = state.db.collection::<User>("users");

    // Reject if the email is already registered.
    let existing = users
        .find_one(doc! { "email": &payload.email })
        .await
        .map_err(internal_error)?;
    if existing.is_some() {
        return Err((StatusCode::CONFLICT, "Email already registered".to_string()));
    }

    // Hash the password — we never store the plain text.
    let password_hash =
        bcrypt::hash(&payload.password, bcrypt::DEFAULT_COST).map_err(internal_error)?;

    let user = User {
        id: None,
        email: payload.email,
        password_hash,
    };
    users.insert_one(user).await.map_err(internal_error)?;

    Ok(StatusCode::CREATED)
}

// The JSON body the client sends to log in.
#[derive(Deserialize)]
struct LoginRequest {
    email: String,
    password: String,
}

// What we send back after a successful login: a signed token plus the email.
#[derive(Serialize)]
struct LoginResponse {
    token: String,
    email: String,
}

// The data we store inside a login token.
#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    // "Subject" — who the token belongs to. We use the user's email.
    sub: String,
    // Expiry as a Unix timestamp (seconds). Checked automatically on decode.
    exp: usize,
}

// How long a login stays valid before the user must sign in again.
const TOKEN_TTL_SECONDS: u64 = 60 * 60 * 24 * 7; // 7 days

// Create a signed token for the given user.
fn create_token(secret: &str, email: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system clock is before the Unix epoch")
        .as_secs();
    let claims = Claims {
        sub: email.to_string(),
        exp: (now + TOKEN_TTL_SECONDS) as usize,
    };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
}

// POST /auth/login — check an email and password against a stored user.
async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, (StatusCode, String)> {
    let users = state.db.collection::<User>("users");

    // Look up the user by email.
    let user = users
        .find_one(doc! { "email": &payload.email })
        .await
        .map_err(internal_error)?;

    // Use the same error whether the email is unknown or the password is
    // wrong, so we don't reveal which emails are registered.
    let invalid = || {
        (
            StatusCode::UNAUTHORIZED,
            "Invalid email or password".to_string(),
        )
    };
    let user = user.ok_or_else(invalid)?;

    // Compare the submitted password against the stored hash.
    let matches =
        bcrypt::verify(&payload.password, &user.password_hash).map_err(internal_error)?;
    if !matches {
        return Err(invalid());
    }

    // Issue a token so the client can prove who it is on later requests.
    let token = create_token(&state.jwt_secret, &user.email).map_err(internal_error)?;
    Ok(Json(LoginResponse {
        token,
        email: user.email,
    }))
}

// An authenticated user, pulled from the `Authorization: Bearer <token>`
// header. Add this as a handler argument to require a valid login.
struct AuthUser {
    email: String,
}

impl FromRequestParts<AppState> for AuthUser {
    type Rejection = (StatusCode, String);

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let unauthorized =
            |msg: &str| (StatusCode::UNAUTHORIZED, msg.to_string());

        // Read the bearer token out of the Authorization header.
        let token = parts
            .headers
            .get(AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
            .and_then(|value| value.strip_prefix("Bearer "))
            .ok_or_else(|| unauthorized("Missing bearer token"))?;

        // Verify the signature and expiry, then read the claims back out.
        let data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(state.jwt_secret.as_bytes()),
            &Validation::default(),
        )
        .map_err(|_| unauthorized("Invalid or expired token"))?;

        Ok(AuthUser {
            email: data.claims.sub,
        })
    }
}

// What GET /me returns: the currently logged-in user.
#[derive(Serialize)]
struct MeResponse {
    email: String,
}

// GET /me — identify the caller from their token. Requires a valid login.
async fn me(auth: AuthUser) -> Json<MeResponse> {
    Json(MeResponse { email: auth.email })
}

// The moods a user is allowed to log.
const ALLOWED_MOODS: [&str; 5] = ["great", "good", "okay", "low", "awful"];

// The JSON body for logging a mood.
#[derive(Deserialize)]
struct CreateMoodRequest {
    mood: String,
    // Optional — defaults to an empty note if the client omits it.
    #[serde(default)]
    note: String,
}

// A mood as sent back to the client (id as a plain hex string).
#[derive(Serialize)]
struct MoodResponse {
    id: String,
    mood: String,
    note: String,
    created_at: i64,
}

impl MoodResponse {
    fn from_mood(mood: Mood) -> Self {
        MoodResponse {
            id: mood.id.map(|id| id.to_hex()).unwrap_or_default(),
            mood: mood.mood,
            note: mood.note,
            created_at: mood.created_at,
        }
    }
}

// POST /moods — log a mood for the authenticated user.
async fn create_mood(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(payload): Json<CreateMoodRequest>,
) -> Result<(StatusCode, Json<MoodResponse>), (StatusCode, String)> {
    // Only accept known moods so the collection stays tidy.
    if !ALLOWED_MOODS.contains(&payload.mood.as_str()) {
        return Err((StatusCode::BAD_REQUEST, "Unknown mood".to_string()));
    }

    let created_at = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system clock is before the Unix epoch")
        .as_millis() as i64;

    let mood = Mood {
        id: None,
        user_email: auth.email,
        mood: payload.mood,
        note: payload.note,
        created_at,
    };

    let moods = state.db.collection::<Mood>("moods");
    let result = moods.insert_one(&mood).await.map_err(internal_error)?;

    // Echo the saved entry back, including its new id.
    let id = result
        .inserted_id
        .as_object_id()
        .map(|id| id.to_hex())
        .unwrap_or_default();
    Ok((
        StatusCode::CREATED,
        Json(MoodResponse {
            id,
            mood: mood.mood,
            note: mood.note,
            created_at: mood.created_at,
        }),
    ))
}

// GET /moods — list the authenticated user's moods, newest first.
async fn list_moods(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<Vec<MoodResponse>>, (StatusCode, String)> {
    let moods = state.db.collection::<Mood>("moods");

    let mut cursor = moods
        .find(doc! { "user_email": &auth.email })
        .sort(doc! { "created_at": -1 })
        .await
        .map_err(internal_error)?;

    let mut out = Vec::new();
    while cursor.advance().await.map_err(internal_error)? {
        let mood = cursor.deserialize_current().map_err(internal_error)?;
        out.push(MoodResponse::from_mood(mood));
    }

    Ok(Json(out))
}

// Turn any error into a 500 Internal Server Error response.
fn internal_error<E: std::fmt::Display>(err: E) -> (StatusCode, String) {
    (StatusCode::INTERNAL_SERVER_ERROR, err.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_registration() {
        let result = validate_registration("user@example.com", "password123");
        assert!(result.is_ok());
    }

    #[test]
    fn test_empty_email() {
        let result = validate_registration("", "password123");
        assert_eq!(result, Err(ValidationError::EmptyEmail));
    }

    #[test]
    fn test_whitespace_only_email() {
        let result = validate_registration("   ", "password123");
        assert_eq!(result, Err(ValidationError::EmptyEmail));
    }

    #[test]
    fn test_empty_password() {
        let result = validate_registration("user@example.com", "");
        assert_eq!(result, Err(ValidationError::EmptyPassword));
    }

    #[test]
    fn test_password_too_short() {
        let result = validate_registration("user@example.com", "pass");
        assert_eq!(result, Err(ValidationError::PasswordTooShort));
    }

    #[test]
    fn test_password_minimum_length() {
        let result = validate_registration("user@example.com", "12345678");
        assert!(result.is_ok());
    }

    #[test]
    fn test_password_too_long() {
        let long_password = "a".repeat(129);
        let result = validate_registration("user@example.com", &long_password);
        assert_eq!(result, Err(ValidationError::PasswordTooLong));
    }

    #[test]
    fn test_password_maximum_length() {
        let max_password = "a".repeat(128);
        let result = validate_registration("user@example.com", &max_password);
        assert!(result.is_ok());
    }

    #[test]
    fn test_invalid_email_no_at() {
        let result = validate_registration("userexample.com", "password123");
        assert_eq!(result, Err(ValidationError::InvalidEmailFormat));
    }

    #[test]
    fn test_invalid_email_no_domain() {
        let result = validate_registration("user@", "password123");
        assert_eq!(result, Err(ValidationError::InvalidEmailFormat));
    }

    #[test]
    fn test_invalid_email_starts_with_at() {
        let result = validate_registration("@example.com", "password123");
        assert_eq!(result, Err(ValidationError::InvalidEmailFormat));
    }

    #[test]
    fn test_invalid_email_no_dot() {
        let result = validate_registration("user@example", "password123");
        assert_eq!(result, Err(ValidationError::InvalidEmailFormat));
    }

    #[test]
    fn test_validation_error_messages() {
        assert_eq!(
            ValidationError::PasswordTooShort.message(),
            "Password must be at least 8 characters"
        );
        assert_eq!(
            ValidationError::PasswordTooLong.message(),
            "Password must not exceed 128 characters"
        );
        assert_eq!(ValidationError::EmptyEmail.message(), "Email cannot be empty");
        assert_eq!(
            ValidationError::EmptyPassword.message(),
            "Password cannot be empty"
        );
        assert_eq!(
            ValidationError::InvalidEmailFormat.message(),
            "Email must be a valid format"
        );
    }
}
