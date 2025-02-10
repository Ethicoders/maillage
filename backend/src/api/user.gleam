import api/common
import core/user as core_user
import db/db
import db/user
import gleam/dict.{type Dict}
import gleam/http/request
import gleam/int
import gleam/io
import gleam/javascript/promise
import gleam/option
import gleam/result
import graphql
import gwt
import helpers
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

pub type AuthenticatedUser {
  AuthenticatedUser(user: User, session_token: String)
}

pub type WithResponseHeaders(h, p) {
  WithResponseHeaders(headers: h, payload: p)
}

pub type RegisterRequest {
  RegisterRequest(name: String, email: Email, password: types_password.Password)
}

pub fn get_current_user(_, _, ctx: graphql.Context) {
  io.debug(ctx)
  use found_user <- promise.map_try(common.get_authenticated_user(ctx.request))
  Ok(User(
    id: found_user.id.value,
    name: found_user.name,
    email: found_user.email,
    slug: found_user.slug,
  ))
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
  _ctx: graphql.Context,
) -> promise.Promise(Result(AuthenticatedUser, String)) {
  let email = variables.request.email
  let password = variables.request.password

  use res <- promise.map(core_user.login(email, password))
  use item <- result.map(res)

  let jwt_string =
    gwt.new()
    |> gwt.set_subject(int.to_string(item.id.value))
    |> gwt.set_audience("0987654321")
    |> gwt.set_not_before(1_704_043_160)
    |> gwt.set_expiration(1_704_046_160)
    |> gwt.set_jwt_id("2468")
    |> gwt.to_string()

  AuthenticatedUser(
    User(id: item.id.value, name: item.name, email: item.email, slug: item.slug),
    jwt_string,
  )
}
