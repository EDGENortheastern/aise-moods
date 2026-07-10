/**
 * Validate registration input.
 * @param {string} email - The email address
 * @param {string} password - The password
 * @returns {string|null} - Error message or null if valid
 */
export function validateRegistration(email, password) {
  // Check for empty fields first
  if (email.trim() === '') {
    return 'Email cannot be empty'
  }

  if (password === '') {
    return 'Password cannot be empty'
  }

  // Validate email format (basic check)
  if (
    !email.includes('@') ||
    !email.includes('.') ||
    email.startsWith('@') ||
    email.endsWith('@')
  ) {
    return 'Email must be a valid format'
  }

  // Check password length
  if (password.length < 8) {
    return 'Password must be at least 8 characters'
  }

  if (password.length > 128) {
    return 'Password must not exceed 128 characters'
  }

  return null
}
