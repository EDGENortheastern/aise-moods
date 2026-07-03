use axum::{routing::get, Router};
use tower_http::cors::CorsLayer;

#[tokio::main]
async fn main() {
    // Allow the React frontend to call this API.
    // Permissive is fine for teaching; tighten to your real origins in production.
    let cors = CorsLayer::permissive();

    // Build the app with a single health check route.
    let app = Router::new()
        .route("/health", get(health))
        .layer(cors);

    // Use the PORT from the environment (Render sets this), else 3000 locally.
    // Bind 0.0.0.0 so the server is reachable when deployed.
    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let addr = format!("0.0.0.0:{port}");

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();

    println!("Backend running on http://{addr}");
    axum::serve(listener, app).await.unwrap();
}

// Returns a simple OK so we can check the server is alive.
async fn health() -> &'static str {
    "OK"
}
