import { useEffect, useState } from 'react'
import Register from './pages/Register'
import Login from './pages/Login'
import { registerUser, loginUser } from './api'

// Which auth screen to show, based on the URL hash (#login / #register).
function currentRoute() {
  return window.location.hash === '#login' ? 'login' : 'register'
}

function App() {
  const [route, setRoute] = useState(currentRoute())

  // Keep the view in sync when the hash changes (e.g. the footer links).
  useEffect(() => {
    const onHashChange = () => setRoute(currentRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (route === 'login') {
    return <Login onSubmit={({ email, password }) => loginUser(email, password)} />
  }

  return (
    <Register onSubmit={({ email, password }) => registerUser(email, password)} />
  )
}

export default App
