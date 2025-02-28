import api/common
import db/db
import db/post
import gleam/int
import gleam/javascript/promise
import gleam/list
import graphql

pub type Post {

  Post(id: Int, content: String, author: Int)
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
          Ok(Post(id: new_post.id.value, content:, author: found_user.id.value))
        Error(_e) -> Error("")
      }
    }
    Error(_) -> promise.resolve(Error(""))
  }
  new_post
}

pub type FeedRequest {
  FeedRequest(content: String)
}

pub fn get_feed(
  _,
  variables: graphql.Variables(FeedRequest),
  ctx: graphql.Context,
) -> promise.Promise(Result(graphql.WithEdges(Post), String)) {
  // let content = variables.request.content

  let out = case db.get_db() {
    Ok(connection) -> {
      use res <- promise.map(post.get_many(connection))
      case res {
        Ok(posts) ->
          Ok(
            graphql.create_edges(
              list.map(posts, fn(post) {
                Post(post.id.value, post.content, post.user_id)
              }),
              fn(node) { int.to_string(node.id) },
            ),
          )
        Error(e) -> Error("")
      }
    }
    Error(e) -> promise.resolve(Error(""))
  }

  out
}
