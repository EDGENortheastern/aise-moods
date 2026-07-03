mod models;

use axum::{
    extract::State,
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use models::User;
use mongodb::{bson::doc, Client, Database};
use serde::{Deserialize, Serialize};
use tower_http::cors::CorsLayer;

// Shared application state passed to route handlers.
#[derive(Clone)]
struct AppState {
    db: Database,
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

    let state = AppState { db };

    // Allow the React frontend to call this API.
    // Permissive is fine for teaching; tighten to your real origins in production.
    let cors = CorsLayer::permissive();

    // Build the app with a single health check route.
    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health))
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
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

// What we send back after a successful login.
#[derive(Serialize)]
struct LoginResponse {
    email: String,
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

    Ok(Json(LoginResponse { email: user.email }))
}

// Turn any error into a 500 Internal Server Error response.
fn internal_error<E: std::fmt::Display>(err: E) -> (StatusCode, String) {
    (StatusCode::INTERNAL_SERVER_ERROR, err.to_string())
}
