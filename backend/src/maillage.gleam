import gleam/http
import gleam/int
import gleam/javascript/promise.{type Promise}
import gleam/option
import glen.{type Request, type Response}
import glen/status
import glen/ws
import repeatedly

@external(javascript, "./graphql.js", "serve")
pub fn serve() -> a

pub fn main() {
  serve()
  // glen.serve(8000, handle_req)
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
