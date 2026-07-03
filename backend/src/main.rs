use axum::{routing::get, Router};

#[tokio::main]
async fn main() {
    // Build the app with a single health check route.
    let app = Router::new().route("/health", get(health));

    // Start the server on port 3000.
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
        .await
        .unwrap();

    println!("Backend running on http://127.0.0.1:3000");
    axum::serve(listener, app).await.unwrap();
}

// Returns a simple OK so we can check the server is alive.
async fn health() -> &'static str {
    "OK"
}
