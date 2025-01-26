import gleam/dict.{type Dict}
import gleam/http
import gleam/int
import gleam/javascript/promise.{type Promise}
import gleam/option
import glen.{type Request, type Response}
import glen/status
import glen/ws
import graphql
import repeatedly
import types/email

import types/password

import api/email as api_email
import api/password as api_password
import api/user as api_user

pub type Query(a) {
  Hello(value: fn(a, graphql.Variables(Nil), graphql.Context) -> String)
}

pub type Mutations(a) {
  Register(
    value: fn(a, graphql.Variables(api_user.RegisterRequest), graphql.Context) ->
      promise.Promise(Result(api_user.User, String)),
  )
  Login(
    value: fn(a, graphql.Variables(api_user.LoginRequest), graphql.Context) ->
      promise.Promise(Result(api_user.User, String)),
  )
}

pub type Scalars {
  Email(value: fn(String) -> email.Email)
  Password(value: fn(String) -> Result(password.Password, String))
}

@external(javascript, "./graphql.js", "serve")
pub fn serve(
  type_string: String,
  query_resolvers: Dict(String, Query(f)),
  mutation_resolvers: Dict(String, Mutations(f)),
  other_resolvers: Dict(String, Scalars),
  // other_resolvers: Dict(String, fn(v) -> o),
) -> a

fn hello(_, _vars, _ctx) -> String {
  "Hello, World!!!"
}

pub fn main() {
  let type_string =
    "type Query {
      hello: String
    }
scalar Email

scalar Password

    type User {name: String!, slug: String!}
    
  input RegisterRequest {name: String!, email: Email!, password: Password!}
  input LoginRequest {email: Email!, password: Password!}

    type Mutation {
      register(request: RegisterRequest!): User
      login(request: LoginRequest!): User
    }"

  let query_resolvers = dict.new() |> dict.insert("hello", Hello(hello))
  let mutation_resolvers =
    dict.new()
    |> dict.insert("register", Register(api_user.register))
    |> dict.insert("login", Login(api_user.login))
  let other_resolvers =
    dict.new()
    |> dict.insert("Email", Email(api_email.validate))
    |> dict.insert("Password", Password(api_password.validate))
  serve(type_string, query_resolvers, mutation_resolvers, other_resolvers)
}

pub fn handle_req(req: Request) -> Promise(Response) {
  // Log all requests and responses
  use <- glen.log(req)
  // Handle potential crashes gracefully
  use <- glen.rescue_crashes
  // Serve static files from ./test/static on the path /static
  use <- glen.static(req, "static", "./test/static")

  case glen.path_segments(req) {
    [] -> index_page(req)
    ["counter"] -> counter_websocket(req)
    _ -> not_found(req)
  }
}

// Load index.html compiled from the frontend app
pub fn index_page(req: Request) -> Promise(Response) {
  use <- glen.require_method(req, http.Get)

  "Let's load the frontend here!"
  |> glen.html(status.ok)
  |> promise.resolve
}

pub fn not_found(_req: Request) -> Promise(Response) {
  "<h1>Oops, are you lost?</h1>
  <p>This page doesn't exist.</p>"
  |> glen.html(status.not_found)
  |> promise.resolve
}

fn counter_websocket(req: Request) -> Promise(Response) {
  use _ <- glen.websocket(
    req,
    on_open: init,
    on_close: stop_repeater,
    on_event: on_event,
  )
  Nil
}

type State {
  State(count: Int, repeater: option.Option(repeatedly.Repeater(Nil)))
}

type Event {
  Increment
}

fn init(_) -> State {
  State(0, option.None)
}

fn stop_repeater(state: State) -> Nil {
  case state.repeater {
    option.Some(r) -> repeatedly.stop(r)
    _ -> Nil
  }
}

fn on_event(
  conn: ws.WebsocketConn(Event),
  state: State,
  msg: ws.WebsocketMessage(Event),
) -> State {
  case msg {
    ws.Text("start") -> {
      let repeater =
        repeatedly.call(500, Nil, fn(_, _) {
          ws.dispatch_event(conn, Increment)
        })

      State(state.count, option.Some(repeater))
    }

    ws.Text("stop") -> {
      stop_repeater(state)
      State(state.count, option.None)
    }

    ws.Event(Increment) -> {
      let _ =
        ws.send_text(
          conn,
          state.count
            |> int.to_string,
        )
      State(state.count + 1, state.repeater)
    }

    _ -> state
  }
}
