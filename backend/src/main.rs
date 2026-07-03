mod models;

use axum::{routing::get, Router};
use mongodb::{bson::doc, Client, Database};
use tower_http::cors::CorsLayer;

// Shared application state passed to route handlers.
#[derive(Clone)]
struct AppState {
    #[allow(dead_code)]
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
