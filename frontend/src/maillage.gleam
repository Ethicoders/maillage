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
import lustre/element/svg
import lustre/ui/cluster
import lustre_http
import model.{type Model, Model}
import modem
import shared.{type Msg, AuthMessage, FeedMessage, Noop, OnChangeView}
import ui/auth/msg
import ui/components/logo
import ui/feed/feed

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
        service.get_client()
        |> gleamql.set_query(query_current_user)
        |> gleamql.set_operation_name("Me")
        |> gleamql.set_header("Authorization", "Bearer " <> session_token)

      let login_decoder = {
        use user <- decode.field("me", auth.user_decoder())
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
  let #(feed_model, feed_effect) = feed.init(flags)

  #(
    Model(auth_model:, feed_model:, view: shared.Main),
    effect.batch([
      get_current_user(),
      effect.map(feed_effect, fn(e) { shared.FeedMessage(e) }),
      modem.init(on_route_change),
    ]),
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
    FeedMessage(feed_msg) -> {
      let #(feed_model, feed_effect) = feed.update(model.feed_model, feed_msg)
      #(Model(..model, feed_model:), feed_effect)
    }
    Noop -> #(Model(..model), effect.none())
  }
}

// VIEW ------------------------------------------------------------------------

fn view(model: Model) -> Element(Msg) {
  let page = case model.view {
    shared.Auth -> view_auth(model) |> layout_empty(model)
    shared.Main -> view_feed(model) |> layout_sidebar(model)
  }

  page
}

fn view_home(_model: Model) {
  view_body([view_title("")])
}

fn view_feed(model: Model) {
  feed.view(model.feed_model)
}

fn view_auth(model: Model) {
  auth.view(model.auth_model)
}

fn layout_empty(child: Element(Msg), _model: Model) {
  html.div([attribute.class("w-full h-full min-h-screen")], [child])
}

fn layout_sidebar(child: Element(Msg), model: Model) {
  html.div(
    [attribute.class("w-full h-full min-h-screen text-default-font flex")],
    [
      // view_nav(model),
      sidebar(model),
      case model.auth_model.current_user {
        option.Some(current_user) -> html.text("Auth")
        // html.text("Authenticated: " <> current_user.name)
        option.None -> html.text("")
      },
      html.div(
        [attribute.class("flex flex-col items-start gap-4 self-stretch flex-1")],
        [child],
      ),
    ],
  )
}

pub fn sidebar(model: Model) {
  html.div(
    [
      attribute.class(
        "sc-keTIit _reset_2qoun_1 sc-ovuCP lhPKPj flex w-20 flex-none flex-col items-start self-stretch bg-[--49e8e4fd-73fb-457b-ae9a-59c2d60e53ae]
",
      ),
      // attribute.draggable(false),
    ],
    [
      html.div(
        [
          attribute.class(
            "sc-keTIit _reset_2qoun_1 flex flex-col items-center justify-center gap-2 p-6 w-full",
          ),
        ],
        [
          html.div([attribute.class("sc-keTIit inGEUB _reset_2qoun_1")], [
            logo.view(
              [
                attribute.attribute("width", "50"),
                attribute.attribute("height", "50"),
              ],
              option.None,
              option.None,
            ),
          ]),
        ],
      ),
      html.div(
        [attribute.class("flex flex-col items-center gap-1 p-2 w-full flex-1")],
        [
          navigation_item(
            "Home",
            [
              svg.path([
                attribute.attribute(
                  "d",
                  "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
                ),
              ]),
              svg.polyline([
                attribute.attribute("points", "9 22 9 12 15 12 15 22"),
              ]),
            ],
            "9 22V12H15V22",
          ),
          navigation_item(
            "Mails",
            [
              svg.polyline([
                attribute.attribute(
                  "points",
                  "22 12 16 12 14 15 10 15 8 12 2 12",
                ),
              ]),
              svg.path([
                attribute.attribute(
                  "d",
                  "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
                ),
              ]),
            ],
            "22 12H16L14 15H10L8 12H2",
          ),
        ],
      ),
      html.div([], [
        case model.auth_model.current_user {
          option.Some(_) -> html.div([], [])
          option.None ->
            html.a([attribute.href("/auth")], [
              html.div(
                [
                  attribute.class(
                    "rounded-full w-10 h-10 border-b border-neutral-border bg-default-font flex items-center justify-center",
                  ),
                ],
                [
                  html.svg(
                    [
                      attribute.attribute("viewBox", "0 0 32 32"),
                      attribute.attribute("height", "32"),
                      attribute.attribute("width", "32"),
                      attribute.attribute("fill", "black"),
                    ],
                    [
                      svg.path([
                        attribute.attribute(
                          "d",
                          "M23.74,16.18a1,1,0,1,0-1.41,1.42A9,9,0,0,1,25,24c0,1.22-3.51,3-9,3s-9-1.78-9-3a9,9,0,0,1,2.63-6.37,1,1,0,0,0,0-1.41,1,1,0,0,0-1.41,0A10.92,10.92,0,0,0,5,24c0,3.25,5.67,5,11,5s11-1.75,11-5A10.94,10.94,0,0,0,23.74,16.18Z",
                        ),
                      ]),
                      svg.path([
                        attribute.attribute(
                          "d",
                          "M16,17a7,7,0,1,0-7-7A7,7,0,0,0,16,17ZM16,5a5,5,0,1,1-5,5A5,5,0,0,1,16,5Z",
                        ),
                      ]),
                    ],
                  ),
                ],
              ),
            ])
        },
      ]),
      // user_avatar(
    //   "https://res.cloudinary.com/subframe/image/upload/v1711417507/shared/fychrij7dzl8wgq2zjq9.avif",
    // ),
    ],
  )
}

fn navigation_item(label: String, paths: List(Element(b)), path2: String) {
  html.div(
    [
      // flex min-h-[48px] flex-col items-center justify-center gap-2 w-full p-[12px_8px_8px] bg-[--baf728fb-606a-51dd-a86c-7cb957e2e7bb] rounded-[--05ebad98-ce65-4785-9582-ebf66b8f5bf4]

      attribute.class(
        "sc-keTIit _reset_2qoun_1 sc-ovuCP lhPKPj _cursorPointer_1ca4c_1 flex min-h-[48px] flex-col items-center justify-center gap-2 w-full p-[12px_8px_8px] rounded-[--05ebad98-ce65-4785-9582-ebf66b8f5bf4]",
      ),
      // attribute.draggable(false),
    // attribute.data("state", "closed")
    ],
    [
      html.span([attribute.class("sc-ghWlax gLamcN icon-module_root__7C4BA")], [
        // html.img([attribute.src("/static/images/" <> icon <> ".svg")]),
        html.svg(
          [
            attribute.attribute("xmlns", "http://www.w3.org/2000/svg"),
            // attribute.attribute("xmlns:xlink", "http://www.w3.org/1999/xlink"),
            attribute.attribute("width", "1em"),
            attribute.attribute("height", "1em"),
            attribute.attribute("viewBox", "0 0 24 24"),
            attribute.attribute("fill", "none"),
            attribute.attribute("stroke", "currentColor"),
            attribute.attribute("stroke-width", "2"),
            attribute.attribute("stroke-linecap", "round"),
            attribute.attribute("stroke-linejoin", "round"),
          ],
          paths,
        ),
      ]),
      html.span([attribute.class("sc-cEzcPc dEBkIT _reset_2qoun_1 font-body")], [
        html.text(label),
      ]),
    ],
  )
}

fn user_avatar(image_url: String) {
  html.div([attribute.class("sc-keTIit ijkSWb _reset_2qoun_1")], [
    html.div(
      [
        attribute.class(
          "sc-keTIit iKTkoW _reset_2qoun_1 sc-ovuCP lhPKPj sf-relative",
        ),
        // attribute.draggable(false),
        // attribute.data("state", "closed"),
        attribute.id("radix-:r40:"),
        // attribute.aria("haspopup", "menu"),
      // attribute.aria("expanded", "false")
      ],
      [
        html.img([
          attribute.class("sc-kLhKbu fdbwju _reset_2qoun_1 sf-absolute"),
          attribute.src(image_url),
        ]),
      ],
    ),
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
