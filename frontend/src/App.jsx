import { useEffect, useState } from 'react'
import Register from './pages/Register'
import Login from './pages/Login'
import Home from './pages/Home'
import { registerUser, loginUser, fetchCurrentUser, logout } from './api'

// Which auth screen to show, based on the URL hash (#login / #register).
function currentRoute() {
  return window.location.hash === '#login' ? 'login' : 'register'
}

function App() {
  const [route, setRoute] = useState(currentRoute())
  const [user, setUser] = useState(null)
  // Start unknown: we check for an existing session before showing anything.
  const [checkingSession, setCheckingSession] = useState(true)

  // Keep the view in sync when the hash changes (e.g. the footer links).
  useEffect(() => {
    const onHashChange = () => setRoute(currentRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // On load, restore the session from a stored token if there is one.
  useEffect(() => {
    fetchCurrentUser()
      .then((current) => setUser(current))
      .finally(() => setCheckingSession(false))
  }, [])

  async function handleLogin({ email, password }) {
    const current = await loginUser(email, password)
    setUser(current)
  }

  function handleLogout() {
    logout()
    setUser(null)
  }

  if (checkingSession) {
    return null
  }

  if (user) {
    return <Home email={user.email} onLogout={handleLogout} />
  }

  if (route === 'login') {
    return <Login onSubmit={handleLogin} />
  }

  return (
    <Register onSubmit={({ email, password }) => registerUser(email, password)} />
  )
}

export default App
