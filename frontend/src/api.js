// Base URL of the backend API.
// For local dev it defaults to the Rust server on port 3000.
// Set VITE_API_URL in a .env file to point at your deployed backend.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Where we keep the login token between page loads.
const TOKEN_KEY = 'aise-moods-token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

// Forget the stored token — used on logout or when it stops working.
export function logout() {
  localStorage.removeItem(TOKEN_KEY)
}

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
// On success, stores the token and returns the logged-in user ({ email }).
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

  const data = await response.json()
  setToken(data.token)
  return { email: data.email }
}

// Ask the backend who the stored token belongs to.
// Returns the user ({ email }), or null if there's no valid session.
export async function fetchCurrentUser() {
  const token = getToken()
  if (!token) return null

  const response = await fetch(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    // The token is missing, invalid, or expired — drop it.
    logout()
    return null
  }

  return response.json()
}
