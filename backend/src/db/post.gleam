import gleam/dynamic/decode.{type Decoder}
import gleam/javascript/promise
import gleam/list
import pog

pub type PostId {
  PostId(value: Int)
}

pub type Post {
  Post(
    id: PostId,
    content: String,
    user_id: Int,
    // remember_digest: String,
    // created_at: String,
    // updated: birl.Time,
  )
}

pub fn decode_post_sql() -> Decoder(Post) {
  {
    use id <- decode.field("id", decode.int)
    use content <- decode.field("content", decode.string)
    use user_id <- decode.field("user_id", decode.int)
    decode.success(Post(PostId(id), content, user_id))
  }
}

pub fn create(conn: pog.Connection, content: String, user_id: Int) {
  let sql =
    "
        INSERT INTO public.post
        (content, user_id)
        VALUES
        ($1, $2)
        RETURNING
            id,
            user_id,
            content,
            created_at::text;
    "

  let query =
    pog.query(sql)
    |> pog.parameter(pog.text(content))
    |> pog.parameter(pog.int(user_id))
    |> pog.returning(decode_post_sql())
  use outcome <- promise.map_try(pog.execute(query, conn))
  let assert Ok(user) = list.first(outcome.rows)

  Ok(user)
}
