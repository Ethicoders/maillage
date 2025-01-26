import db/db
import db/user
import gleam/io
import gleam/javascript/promise
import gleam/option
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

  case db.get_db() {
    Ok(connection) -> {
      promise.await(
        user.get_by_email(connection, email.to_string(email)),
        fn(res) {
          case res {
            Ok(option) ->
              case option {
                option.Some(item) -> {
                  case item.password_digest {
                    option.Some(password_digest) ->
                      promise.await(
                        types_password.valid(password, password_digest),
                        fn(is_matching) {
                          case is_matching {
                            True -> {
                              let user =
                                User(
                                  id: item.id.value,
                                  name: item.name,
                                  email: item.email,
                                  slug: item.slug,
                                )
                              promise.resolve(Ok(user))
                            }
                            False -> promise.resolve(Error("Invalid password"))
                          }
                        },
                      )
                    option.None -> promise.resolve(Error(""))
                  }
                }
                option.None -> promise.resolve(Error("User not found"))
              }
            Error(e) -> promise.resolve(Error(""))
          }
        },
      )
    }
    Error(_) -> promise.resolve(Error("Database connection failed"))
  }
}
