import types/email

pub type Response {
  Response(value: String)
}

pub fn validate(value: String) {
  email.parse_safe(value)
}
