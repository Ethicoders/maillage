import db/user
import gleam/dynamic/decode.{type Decoder}
import gleam/javascript/promise
import gleam/list
import pog.{type Connection}

pub type PostId {
  PostId(value: Int)
}

pub type Post {
  Post(
    id: PostId,
    content: String,
    user: user.User,
    // remember_digest: String,
    // created_at: String,
    // updated: birl.Time,
  )
}

pub fn decode_post_sql() -> Decoder(Post) {
  use id <- decode.field("post_id", decode.int)
  use content <- decode.field("content", decode.string)
  use user <- decode.map(user.decode_user_sql())
  Post(PostId(id), content, user)
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

pub fn get_many(
  conn: Connection,
) -> promise.Promise(Result(List(Post), pog.QueryError)) {
  let sql =
    "
SELECT
    p.id AS post_id,
    p.content AS content,
    u.id AS user_id,
    u.name,
    u.email,
    u.slug
FROM
    public.post p
JOIN
    public.user u ON p.user_id = u.id;
  "

  let query =
    pog.query(sql)
    |> pog.returning(decode_post_sql())

  use outcome <- promise.map_try(pog.execute(query, conn))

  Ok(outcome.rows)
}
