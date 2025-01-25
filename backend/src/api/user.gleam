import db/db
import db/user
import gleam/io
import gleam/javascript/promise
import graphql
import pog
import types/email.{type Email}
import types/password

pub type User {
  User(
    id: Int,
    name: String,
    email: String,
    slug: String,
    // created_at: birl.Time,
    // updated: birl.Time,
  )
}

pub type RegisterRequest {
  RegisterRequest(name: String, email: Email, password: password.Password)
}

pub fn register(
  _,
  variables: graphql.Variables(RegisterRequest),
  _ctx: graphql.Context(RegisterRequest),
) -> promise.Promise(Result(User, String)) {
  let name = variables.request.name
  let email = variables.request.email
  let password = variables.request.password

  use password_hash <- promise.await(password.hash(password))

  case db.get_db() {
    Ok(connection) -> {
      use p <- promise.map(user.create(
        connection,
        name,
        email.to_string(email),
        password_hash,
      ))

      case p {
        Ok(item) -> {
          Ok(User(
            id: item.id.value,
            name: item.name,
            email: item.email,
            slug: item.slug,
          ))
        }
        Error(pog_error) -> {
          io.debug(pog_error)
          Error(case pog_error {
            pog.ConnectionUnavailable -> "ConnectionUnavailable"
            pog.ConstraintViolated(_, _, _) -> "ConstraintViolated"
            pog.PostgresqlError(_, _, _) -> "PostgresqlError"
            pog.QueryTimeout -> "QueryTimeout"
            pog.UnexpectedArgumentCount(_, _) -> "UnexpectedArgumentCount"
            pog.UnexpectedArgumentType(_, _) -> "UnexpectedArgumentType"
            pog.UnexpectedResultType(_) -> {
              "UnexpectedResultType"
            }
          })
          // Error("Something went wrong")
        }
      }
      // promise.map_try(user.create(connection, name, email, password), fn(item) {
      //       Ok(User(
      //         id: item.id,
      //         name: item.name,
      //         email: item.email,
      //         slug: item.slug,
      //       ))
      // result.map(res, fn(item) {
      //   User(id: item.id, name: item.name, email: item.email, slug: item.slug)
      // })
    }
    Error(_) -> promise.resolve(Error(""))
  }
}
// fn login() {
//   todo
// }
