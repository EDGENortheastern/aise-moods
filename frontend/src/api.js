// Base URL of the backend API.
// For local dev it defaults to the Rust server on port 3000.
// Set VITE_API_URL in a .env file to point at your deployed backend.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Send a register request to the backend.
export async function registerUser(email, password) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Registration failed')
  }
}

// Send a login request to the backend.
// Returns the logged-in user ({ email }) on success.
export async function loginUser(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Login failed')
  }

  return response.json()
}
