import api/common
import gleam/javascript/promise
import graphql

pub type Post {

  Post(content: String, author: Int)
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

  use found_user <- promise.map_try(common.get_authenticated_user(ctx.request))
  Ok(Post(content:, author: found_user.id.value))
}
