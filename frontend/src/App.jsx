import Register from './pages/Register'
import { registerUser } from './api'

function App() {
  return (
    <Register onSubmit={({ email, password }) => registerUser(email, password)} />
  )
}

export default App
