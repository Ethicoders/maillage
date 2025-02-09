import gleam/io
import gleam/uri.{type Uri}
import lustre
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/ui/cluster
import model.{type Model, Model}
import modem
import shared.{type Msg, AuthMessage, OnChangeView}

import ui/auth/auth
import ui/auth/msg as auth_msg

// MAIN ------------------------------------------------------------------------

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
}

// MODEL -----------------------------------------------------------------------

fn init(flags) -> #(Model, Effect(Msg)) {
  let #(auth_model, _effect) = auth.init(flags)
  #(Model(auth_model:, view: shared.Main), modem.init(on_route_change))
}

fn on_route_change(uri: Uri) -> Msg {
  case uri.path_segments(uri.path) {
    ["auth"] -> OnChangeView(shared.Auth)
    _ -> OnChangeView(shared.Main)
  }
}

// UPDATE ----------------------------------------------------------------------

fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    OnChangeView(route) -> #(Model(..model, view: route), effect.none())
    AuthMessage(auth_msg) -> {
      case auth_msg {
        auth_msg.AuthSwitchAction(action) -> {
          #(Model(..model, auth_model: auth.Model(action)), effect.none())
        }
        auth_msg.LoginResponse(user) -> {
          io.debug(user)
          // Store the current user data in state
          #(Model(..model), effect.none())
        }
        auth_msg.Authenticate -> {
          let #(auth_model, ef) = auth.update(model.auth_model, auth_msg)

          #(Model(..model, auth_model:), ef)
        }
      }
    }
  }
}

// VIEW ------------------------------------------------------------------------

fn view(model: Model) -> Element(Msg) {
  let styles = []

  let page = case model.view {
    shared.Auth -> view_auth(model)
    shared.Main -> view_home(model)
  }

  html.div([attribute.style(styles)], [view_nav(model), page])
}

fn view_home(_model: Model) {
  view_body([view_title("")])
}

fn view_auth(model: Model) {
  auth.view(model.auth_model)
}

fn view_nav(_model: Model) -> Element(a) {
  let item_styles = [#("text-decoration", "underline")]

  let view_nav_item = fn(path, text) {
    html.a([attribute.href("/" <> path), attribute.style(item_styles)], [
      element.text(text),
    ])
  }

  cluster.of(html.nav, [], [
    view_nav_item("", "Home"),
    view_nav_item("auth", "Auth"),
  ])
}

fn view_body(children) {
  html.div([], children)
}

fn view_title(text) {
  html.h1([], [element.text(text)])
}
