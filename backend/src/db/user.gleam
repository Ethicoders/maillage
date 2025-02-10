import gleam/dynamic.{type Dynamic}
import gleam/dynamic/decode.{type Decoder}
import gleam/javascript/promise
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/result
import pog.{type Connection}

pub type UserId {
  UserId(value: Int)
}

pub fn id_to_int(id: UserId) -> Int {
  id.value
}

pub fn decode_user_id(d: Dynamic) {
  use value <- result.try(dynamic.int(d))
  Ok(UserId(value))
}

pub type User {
  User(
    id: UserId,
    name: String,
    email: String,
    slug: String,
    password_digest: Option(String),
    // remember_digest: String,
    // created_at: String,
    // updated: birl.Time,
  )
}

pub fn decode_user_sql() -> Decoder(User) {
  {
    use id <- decode.field("id", decode.int)
    use name <- decode.field("name", decode.string)
    use email <- decode.field("email", decode.string)
    use password_digest <- decode.optional_field(
      "password_digest",
      None,
      decode.optional(decode.string),
    )
    // use created_at <- decode.field("created_at", decode.string)
    use slug <- decode.field("slug", decode.string)
    // use x5 <- decode.field("", decode.string)

    // birl.from_naive

    // let user_email = email.parse_safe(email)
    // use x6 <- decode.field(4, pog.timestamp_decoder())
    // use x7 <- decode.field(4, pog.timestamp_decoder())
    decode.success(User(UserId(id), name, email, slug, password_digest))
  }
}

pub fn create(
  conn: Connection,
  name: String,
  email: String,
  password_hash: String,
) -> promise.Promise(Result(User, pog.QueryError)) {
  let sql =
    "
        INSERT INTO public.user
        (name, slug, email, password_digest)
        VALUES
        ($1, $2, $3, $4)
        RETURNING
            id,
            name,
            slug,
            email,
            password_digest,
            created_at::text;
    "

  let query =
    pog.query(sql)
    |> pog.parameter(pog.text(name))
    |> pog.parameter(pog.text(name))
    |> pog.parameter(pog.text(email))
    |> pog.parameter(pog.text(password_hash))
    |> pog.returning(decode_user_sql())
  use outcome <- promise.map_try(pog.execute(query, conn))
  let assert Ok(user) = list.first(outcome.rows)

  Ok(user)
}

pub fn get_by_id(
  conn: Connection,
  id: Int,
) -> promise.Promise(Result(Option(User), pog.QueryError)) {
  let sql =
    "
    SELECT
        id,
        name,
        slug,
        email
    FROM public.user
    WHERE id = $1
  "

  // use result <- result.try({
  //   pog.execute(sql, conn, [id.value |> pog.int()], decode_user_sql)
  // })

  let query =
    pog.query(sql)
    |> pog.parameter(pog.int(id))
    |> pog.returning(decode_user_sql())

  use outcome <- promise.map_try(pog.execute(query, conn))
  // use items <- result.try({ pog.execute(query, conn) })

  case outcome.rows {
    [] -> Ok(None)
    [user] -> Ok(Some(user))
    _ -> panic as "Unreachable"
  }
}

pub fn get_by_ids(
  conn: Connection,
  ids: List(UserId),
) -> promise.Promise(Result(List(User), pog.QueryError)) {
  let sql =
    "
    SELECT
        id,
        email_address,
        password_digest,
        created_at::text
    FROM user
    WHERE id IN $1
  "

  // use result <- result.try({
  //   pog.execute(
  //     sql,
  //     conn,
  //     [ids |> list.map(fn(id) { id.value }) |> pog.array()],
  //     decode_user_sql,
  //   )
  // })

  let query =
    pog.query(sql)
    |> pog.parameter(pog.array(pog.int, ids |> list.map(fn(id) { id.value })))
    |> pog.returning(decode_user_sql())

  use outcome <- promise.map_try(pog.execute(query, conn))

  Ok(outcome.rows)
}

pub fn get_by_email(
  conn: Connection,
  email: String,
) -> promise.Promise(Result(Option(User), pog.QueryError)) {
  let sql =
    "
    SELECT
        id,
        name,
        email,
        slug,
        password_digest,
        created_at::text
    FROM public.user
    WHERE email = $1
  "

  let query =
    pog.query(sql)
    |> pog.parameter(email |> pog.text())
    |> pog.returning(decode_user_sql())

  use outcome <- promise.map_try(pog.execute(query, conn))

  case outcome.rows {
    [] -> Ok(None)
    [user] -> Ok(Some(user))
    _ -> panic as "Unreachable"
  }
}

pub fn get_by_session_token(
  conn: Connection,
  session_token: String,
) -> promise.Promise(Result(Option(User), pog.QueryError)) {
  let sql =
    "
    SELECT
        id,
        name,
        email,
        slug,
        password_digest,
        created_at::text
    FROM public.user
    WHERE session_token = $1
  "

  let query =
    pog.query(sql)
    |> pog.parameter(session_token |> pog.text())
    |> pog.returning(decode_user_sql())

  use outcome <- promise.map_try(pog.execute(query, conn))

  case outcome.rows {
    [] -> Ok(None)
    [user] -> Ok(Some(user))
    _ -> panic as "Unreachable"
  }
}

pub fn set_session_token(
  conn: Connection,
  user_id,
  session_token: String,
) -> promise.Promise(Result(Option(User), pog.QueryError)) {
  let sql =
    "
    UPDATE public.user
    SET session_token = $1
    WHERE id = $2
    RETURNING id,
        name,
        email,
        slug;
  "

  let query =
    pog.query(sql)
    |> pog.parameter(session_token |> pog.text())
    |> pog.parameter(user_id |> pog.int())
    |> pog.returning(decode_user_sql())

  use outcome <- promise.map_try(pog.execute(query, conn))

  case outcome.rows {
    [] -> Ok(None)
    [user] -> Ok(Some(user))
    _ -> panic as "Unreachable"
  }
}
