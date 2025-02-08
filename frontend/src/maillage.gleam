import gleam/dynamic
import gleam/io
import gleam/list
import gleam/option
import gleam/result
import gleam/string
import gleam/uri.{type Uri}
import lustre
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import lustre/ui
import lustre/ui/cluster
import model.{type Model, Model}
import modem
import shared.{type Msg, AuthMessage, AuthResponse, OnChangeView}

import ui/views/auth
import ui/views/authmsg.{AuthSwitchAction}

// MAIN ------------------------------------------------------------------------

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
}

// MODEL -----------------------------------------------------------------------

// type Model {
//   Model(current_route: Route, guests: List(Guest), new_guest_name: String)
// }

type Guest {
  Guest(slug: String, name: String)
}

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
        AuthSwitchAction(action) -> {
          io.debug(action)
          #(
            Model(..model, auth_model: auth.Model(action, hello: option.None)),
            effect.none(),
          )
        }
        authmsg.LoginResponse(user) -> {
          io.debug(user)
          #(Model(..model), effect.none())
        }
        authmsg.Authenticate -> {
          let #(auth_model, ef) = auth.update(model.auth_model, auth_msg)

          #(Model(..model, auth_model:), ef)
        }
        // switch auth action
        // login/register
      }
      // auth.update(#(model.auth_model, effect.none()), message)
      // #(Model(..model), effect.none())
    }
    AuthResponse(_) -> todo
    // UserUpdatedNewGuestName(name) -> #(Model(..model), effect.none())
    // UserAddedNewGuest(guest) -> #(
    //   Model(
    //     ..model,
    //     // guests: list.append(model.guests, [guest]),
    //   // new_guest_name: "",
    //   ),
    //   effect.none(),
    // )
    // Auth -> 
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

fn view_home(model: Model) {
  // let new_guest_input = fn(event) {
  //   use key_code <- result.try(dynamic.field("key", dynamic.string)(event))
  //   case key_code {
  //     "Enter" -> {
  //       let guest_slug =
  //         model.new_guest_name
  //         |> string.replace(" ", "-")
  //         |> string.lowercase
  //       Ok(
  //         UserAddedNewGuest(Guest(name: model.new_guest_name, slug: guest_slug)),
  //       )
  //     }
  //     _ -> {
  //       use value <- result.try(event.value(event))
  //       Ok(UserUpdatedNewGuestName(value))
  //     }
  //   }
  // }

  view_body([
    view_title(""),
    ui.input([
      // event.on("keyup", new_guest_input),
    // attribute.value(model.new_guest_name),
    ]),
  ])
}

fn view_auth(model: Model) {
  auth.view(model.auth_model)
  // case auth.main() {
  //   Ok(_) -> view_body([view_title("Auth 🏡"), lustre.element("auth")])
  //   Error(_) -> panic as "Failed to create auth app"
  // }
}

fn view_welcome(model: Model, slug) -> Element(a) {
  // let guest =
  //   model.guests
  //   |> list.find(fn(guest: Guest) { guest.slug == slug })

  // let title = case guest {
  //   Ok(guest) -> view_title("Hello, " <> guest.name <> "! 🎉")
  //   _ -> view_title("Sorry ... didn't quite catch that.")
  // }
  let title = view_title("")

  view_body([title])
}

fn view_nav(model: Model) -> Element(a) {
  let item_styles = [#("text-decoration", "underline")]

  let view_nav_item = fn(path, text) {
    html.a([attribute.href("/" <> path), attribute.style(item_styles)], [
      element.text(text),
    ])
  }

  cluster.of(html.nav, [], [
    view_nav_item("", "Home"),
    view_nav_item("auth", "Auth"),
    // ..guest_nav_isstems
  ])
}

fn view_body(children) {
  html.div([], children)
}

fn view_title(text) {
  html.h1([], [element.text(text)])
}
