import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Register from './Register'

describe('Register screen', () => {
  it('shows the create account heading', () => {
    render(<Register />)
    expect(
      screen.getByRole('heading', { name: /create account/i })
    ).toBeInTheDocument()
  })

  it('has email and password fields', () => {
    render(<Register />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('has a register button', () => {
    render(<Register />)
    expect(
      screen.getByRole('button', { name: /register/i })
    ).toBeInTheDocument()
  })

  it('calls onSubmit with the entered email and password', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<Register onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/email/i), 'you@university.edu')
    await user.type(screen.getByLabelText(/password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /register/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'you@university.edu',
      password: 'secret123',
    })
  })
})
