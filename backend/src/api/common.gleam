import db/db
import db/user
import gleam/int
import gleam/io
import gleam/javascript/promise
import gleam/list
import gleam/option
import gleam/result
import gleam/string
import glen
import gwt
import pog

fn get_session_token(req: glen.Request) {
  let res =
    list.find_map(req.headers, fn(item) {
      case item {
        #("authorization", value) -> {
          Ok(string.replace(value, each: "Bearer ", with: ""))
        }
        _other -> Error(False)
      }
    })

  use _err <- result.map_error(res)
  "No active session"
}

pub fn get_authenticated_user(
  req: glen.Request,
) -> promise.Promise(Result(user.User, String)) {
  let pool = db.get_db()
  case pool {
    Ok(pool) -> {
      case get_session_token(req) {
        Ok(session_token) -> {
          let assert Ok(jwt) = gwt.from_string(session_token)
          let assert Ok(string_user_id) = gwt.get_subject(jwt)
          io.debug(string_user_id)
          let assert Ok(user_id) = int.parse(string_user_id)

          let p = user.get_by_id(pool, user_id)

          use r <- promise.map(p)
          result.try(r, fn(o) { option.to_result(o, pog.ConnectionUnavailable) })
          |> result.map_error(fn(_e) { "User not found" })
        }
        Error(e) -> Error(e) |> promise.resolve
      }
    }
    Error(_x) -> Error("User not found") |> promise.resolve
  }
}
