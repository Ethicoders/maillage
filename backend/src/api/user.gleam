import core/user as core_user
import db/db
import db/user
import gleam/io
import gleam/javascript/promise
import gleam/result
import graphql
import pog
import types/email.{type Email}
import types/password as types_password

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
  RegisterRequest(name: String, email: Email, password: types_password.Password)
}

pub fn register(
  _,
  variables: graphql.Variables(RegisterRequest),
  _ctx: graphql.Context,
) -> promise.Promise(Result(User, String)) {
  let name = variables.request.name
  let email = variables.request.email
  let password = variables.request.password

  use password_hash <- promise.await(types_password.hash(password))

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
        }
      }
    }
    Error(_) -> promise.resolve(Error(""))
  }
}

pub type LoginRequest {
  LoginRequest(email: Email, password: types_password.Password)
}

pub fn login(
  _,
  variables: graphql.Variables(LoginRequest),
  _ctx,
) -> promise.Promise(Result(User, String)) {
  let email = variables.request.email
  let password = variables.request.password

  use res <- promise.map(core_user.login(email, password))
  use item <- result.map(res)
  User(id: item.id.value, name: item.name, email: item.email, slug: item.slug)
}
