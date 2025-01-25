import gleam/javascript/promise

@external(javascript, "./argon2.js", "hash")
pub fn hash(password: String) -> promise.Promise(a)

@external(javascript, "./argon2.js", "verify")
pub fn verify(hash: String, password: String) -> promise.Promise(bool)
