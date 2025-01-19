import gleam/dynamic.{string}
import gleam/option.{type Option, None, Some}
import gleamql
import lustre
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import lustre_http

type Model {
  Model(hello: Option(Hello))
}

fn init(_flags) -> #(Model, Effect(Msg)) {
  #(Model(hello: None), effect.none())
}

pub type Data {
  Data(hello: String)
}

pub type Hello {
  Hello(hello: String)
}

const simple_query = "query SayHello {
  hello
}"

fn sayhello() -> Effect(Msg) {
  let res =
    gleamql.new()
    |> gleamql.set_query(simple_query)
    // |> gleamql.set_variable("code", json.string("GB"))
    |> gleamql.set_uri("http://localhost:8000/graphql")
    |> gleamql.set_header("Content-Type", "application/json")
  let decoder =
    dynamic.decode1(
      Hello,
      dynamic.field("data", dynamic.field("hello", string)),
    )
  gleamql.send(res, lustre_http.expect_json(decoder, ApiUpdatedQuote))
}

pub opaque type Msg {
  UserClickedRefresh
  ApiUpdatedQuote(Result(Hello, lustre_http.HttpError))
}

fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    UserClickedRefresh -> #(model, sayhello())
    ApiUpdatedQuote(Ok(hello)) -> #(Model(hello: Some(hello)), effect.none())
    ApiUpdatedQuote(Error(_)) -> #(model, effect.none())
  }
}

fn view(model: Model) -> Element(Msg) {
  let styles = [#("width", "100vw"), #("height", "100vh"), #("padding", "1rem")]

  html.div([], [
    html.h1([], [element.text("Hello, world.")]),
    html.h2([], [element.text("Welcome to Lustre.")]),
    html.button([event.on_click(UserClickedRefresh)], [
      element.text("Say hello"),
    ]),
  ])
}

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "div", Nil)
  Nil
}
