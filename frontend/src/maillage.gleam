import app.{type Model, type Msg}
import feed/feed
import feed/msg
import feed/state
import gleam/dynamic.{string}
import gleam/io
import gleam/option.{type Option, None, Some}
import lustre
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event

fn init(_flags: a) -> #(Model, Effect(Msg)) {
  let #(fs, msg) = feed.init()
  #(app.Model(fs), msg)
}

fn update(model: Model, msg: app.Msg) -> #(Model, Effect(app.Msg)) {
  case msg {
    app.FeedMsg(msg) -> {
      let #(m, e) = feed.update(model.feed_state, msg)
      #(app.Model(m), e)
    }
    app.UserClickedRefresh -> todo
  }
}

fn view(model: Model) -> Element(app.Msg) {
  let styles = [#("width", "100vw"), #("height", "100vh"), #("padding", "1rem")]
  io.debug(model)
  html.div([], [
    html.h1([], [element.text("Hello, world.")]),
    html.h2([], [element.text("Welcome to Lustre.")]),
    html.button(
      [
        event.on_click(
          app.FeedMsg(msg.LoadMore(
            model.feed_state.to,
            model.feed_state.to + 10,
          )),
        ),
      ],
      [element.text("Say hello")],
    ),
    feed.render(model.feed_state),
  ])
}

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "div", Nil)
  Nil
}
