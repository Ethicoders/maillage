import api/service
import api/user
import gleam/dynamic/decode
import gleam/io
import gleam/list
import gleam/option
import gleam/result
import gleam/uri.{type Uri}
import gleamql
import lustre
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/ui/cluster
import lustre_http
import model.{type Model, Model}
import modem
import shared.{type Msg, AuthMessage, Noop, OnChangeView}
import ui/auth/msg

import ui/auth/auth

const query_current_user = "query Me {
  me {
    name
    slug
  }
}"

fn get_current_user() {
  case auth.get_token() {
    Ok(session_token) -> {
      let res =
        gleamql.new()
        |> gleamql.set_query(query_current_user)
        |> gleamql.set_operation_name("Me")
        |> gleamql.set_uri(service.get_url() <> "/graphql")
        |> gleamql.set_header("Content-Type", "application/json")
        |> gleamql.set_header("Authorization", "Bearer " <> session_token)

      let user_decoder = {
        use name <- decode.field("name", decode.string)
        // use email <- decode.field("email", decode.string)
        use slug <- decode.field("slug", decode.string)
        // use id <- decode.field("email", decode.int)
        decode.success(user.User(id: 0, name:, slug:, email: ""))
      }

      let login_decoder = {
        use user <- decode.field("me", user_decoder)
        decode.success(user)
      }

      let final_decoder = {
        use login <- decode.field("data", login_decoder)
        decode.success(login)
      }

      gleamql.send(
        res,
        lustre_http.expect_json(
          fn(dyn) {
            use err <- result.map_error(decode.run(dyn, final_decoder))
            io.debug(err)
            []
          },
          fn(res) {
            let assert Ok(session_token) =
              auth.get_token()
              |> result.map_error(fn(_) {
                panic as "Failed getting access to storage!"
              })
            case res {
              Ok(user) ->
                AuthMessage(
                  msg.LoginResponse(user.AuthenticatedUser(
                    user:,
                    session_token:,
                  )),
                )
              Error(e) -> {
                io.debug(e)
                panic
              }
            }
          },
        ),
      )
    }
    Error(_) -> effect.from(fn(dispatch) { dispatch(Noop) })
  }
}

// MAIN ------------------------------------------------------------------------

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
}

// MODEL -----------------------------------------------------------------------

fn init(flags) -> #(Model, Effect(Msg)) {
  let #(auth_model, _effect) = auth.init(flags)

  #(
    Model(auth_model:, view: shared.Main),
    effect.batch([get_current_user(), modem.init(on_route_change)]),
  )
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
      let #(auth_model, auth_effect) = auth.update(model.auth_model, auth_msg)
      #(Model(..model, auth_model:), auth_effect)
    }
    Noop -> #(Model(..model), effect.none())
  }
}

// VIEW ------------------------------------------------------------------------

fn view(model: Model) -> Element(Msg) {
  let page = case model.view {
    shared.Auth -> view_auth(model) |> layout_empty(model)
    shared.Main -> view_home(model) |> layout_sidebar(model)
  }

  page
}

fn view_home(_model: Model) {
  view_body([view_title("")])
}

fn view_auth(model: Model) {
  auth.view(model.auth_model)
}

fn layout_empty(child: Element(Msg), _model: Model) {
  html.div([attribute.class("w-full h-full min-h-screen")], [child])
}

fn layout_sidebar(child: Element(Msg), model: Model) {
  html.div([attribute.class("w-full h-full min-h-screen text-default-font")], [
    view_nav(model),
    child,
    case model.auth_model.current_user {
      option.Some(current_user) ->
        html.text("Authenticated: " <> current_user.name)
      option.None -> html.text("")
    },
  ])
}

fn view_nav(model: Model) -> Element(a) {
  let view_nav_item = fn(path, text) {
    html.a([attribute.href("/" <> path), attribute.class("text-brand-700")], [
      element.text(text),
    ])
  }

  let nav_items =
    list.filter_map([#("", "Home"), #("auth", "Auth")], fn(item) {
      case item.0 {
        "auth" ->
          case model.auth_model.current_user {
            option.Some(_) -> Error("")
            option.None -> Ok(view_nav_item(item.0, item.1))
          }
        _ -> Ok(view_nav_item(item.0, item.1))
      }
    })

  cluster.of(html.nav, [], nav_items)
}

fn view_body(children) {
  html.div([], children)
}

fn view_title(text) {
  html.h1([], [element.text(text)])
}
