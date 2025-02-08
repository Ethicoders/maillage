import db/db
import db/user
import gleam/io
import gleam/javascript/promise
import gleam/list
import gleam/option
import gleam/result
import glen
import graphql
import pog

pub type Post {

  Post(content: String, author: Int)
}

pub type CreatePostRequest {
  CreatePostRequest(content: String)
}

fn get_session_token(req: glen.Request) {
  let res =
    list.find_map(req.headers, fn(item) {
      case item {
        #("cookie", v) -> {
          io.debug(v)
          Ok(v)
        }
        _other -> Error(False)
      }
    })
  use _err <- result.map_error(res)
  "No active session"
}

fn get_authenticated_user(
  req: glen.Request,
) -> promise.Promise(Result(user.User, String)) {
  let pool = db.get_db()
  case pool {
    Ok(pool) -> {
      case get_session_token(req) {
        Ok(session_token) -> {
          let p = user.get_by_session_token(pool, session_token)

          use r <- promise.map(p)
          result.try(r, fn(o) { option.to_result(o, pog.ConnectionUnavailable) })
          |> result.map_error(fn(_e) { "User not found" })
        }
        Error(e) -> Error(e) |> promise.resolve
      }
    }
    Error(x) -> Error("User not found") |> promise.resolve
  }
}

pub fn create(
  _,
  variables: graphql.Variables(CreatePostRequest),
  ctx: graphql.Context,
) -> promise.Promise(Result(Post, String)) {
  let content = variables.request.content

  use found_user <- promise.map_try(get_authenticated_user(ctx.request))
  Ok(Post(content:, author: found_user.id.value))
}
