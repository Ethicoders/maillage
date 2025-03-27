import api/common
import api/user
import db/db
import db/post
import gleam/int
import gleam/io
import gleam/javascript/promise
import gleam/list
import gleam/option
import graphql
import pog

pub type Post {

  Post(id: String, content: String, author: user.User)
}

pub type CreatePostRequest {
  CreatePostRequest(content: String)
}

pub fn create(
  _,
  variables: graphql.Variables(CreatePostRequest),
  ctx: graphql.Context,
) -> promise.Promise(Result(Post, String)) {
  let content = variables.request.content

  use found_user <- promise.try_await(common.get_authenticated_user(ctx.request))
  let new_post = case db.get_db() {
    Ok(conn) -> {
      let promres = post.create(conn, content, found_user.id.value)

      use res <- promise.map(promres)
      case res {
        Ok(new_post) ->
          Ok(Post(
            id: int.to_string(new_post.id.value),
            content:,
            author: user.User(
              // found_user.email,
              int.to_string(found_user.id.value),
              found_user.name,
              found_user.slug,
            ),
          ))
        Error(_e) -> Error("")
      }
    }
    Error(_) -> promise.resolve(Error(""))
  }
  new_post
}

pub type FeedRequest {
  FeedRequest(author_id: option.Option(String))
}

pub fn get_feed(
  _,
  variables: graphql.Variables(FeedRequest),
  _ctx: graphql.Context,
) -> promise.Promise(Result(graphql.WithEdges(Post), String)) {
  // let content = variables.request.content

  let out = case db.get_db() {
    Ok(connection) -> {
      use res <- promise.map(post.get_many(connection))
      case res {
        Ok(posts) ->
          Ok(graphql.create_edges(
            list.map(posts, fn(post) {
              Post(
                int.to_string(post.id.value),
                post.content,
                user.User(
                  // post.user.email,
                  int.to_string(post.user.id.value),
                  post.user.name,
                  post.user.slug,
                ),
              )
            }),
            fn(node) { node.id },
          ))
        Error(pog_error) -> {
          Error(case pog_error {
            pog.ConnectionUnavailable -> "ConnectionUnavailable"
            pog.ConstraintViolated(_, _, _) -> "ConstraintViolated"
            pog.PostgresqlError(_, _, _) -> "PostgresqlError"
            pog.QueryTimeout -> "QueryTimeout"
            pog.UnexpectedArgumentCount(_, _) -> "UnexpectedArgumentCount"
            pog.UnexpectedArgumentType(_, _) -> "UnexpectedArgumentType"
            pog.UnexpectedResultType(e) -> {
              io.debug(e)
              "UnexpectedResultType"
            }
          })
        }
      }
    }
    Error(e) -> promise.resolve(Error(e))
  }

  out
}
