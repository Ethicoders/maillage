import gleam/result
import types/password

pub fn validate(value: String) {
  use parsed <- result.try(password.create(value))
  use password <- result.try(password.policy_compliant(
    parsed,
    password.PasswordPolicy(8, 40),
  ))
  Ok(password)
}
