pub type User {
  User(
    id: String,
    name: String,
    slug: String,
    // created_at: birl.Time,
    // updated: birl.Time,
  )
}

pub type AuthenticatedUser {
  AuthenticatedUser(user: User, session_token: String)
}
