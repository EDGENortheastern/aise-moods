import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from './Login'

describe('Login screen', () => {
  it('shows the log in heading', () => {
    render(<Login />)
    expect(
      screen.getByRole('heading', { name: /log in/i })
    ).toBeInTheDocument()
  })

  it('has email and password fields', () => {
    render(<Login />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('has a log in button', () => {
    render(<Login />)
    expect(
      screen.getByRole('button', { name: /log in/i })
    ).toBeInTheDocument()
  })

  it('calls onSubmit with the entered email and password', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<Login onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/email/i), 'you@university.edu')
    await user.type(screen.getByLabelText(/password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'you@university.edu',
      password: 'secret123',
    })
  })
})
