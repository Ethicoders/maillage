import api/service.{get_url}
import api/user.{type User}
import gleam/dict
import gleam/dynamic
import gleam/dynamic/decode
import gleam/io
import gleam/json
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/result
import gleamql
import lustre
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element/html
import lustre/event
import lustre_http
import shared
import ui/views/authaction.{type Action}
import ui/views/authmsg.{type Msg}
import ui/views/others.{Login}

pub type Data {
  LoginRequest(name: String)
  RegisterRequest(name: String)
}

pub type Register {
  Register(hello: String)
}

const query_login = "mutation Login($email: Email!, $password: Password!) {
  login(request: {email: $email, password: $password}) {
    name
    slug
  }
}"

const query_register = "mutation Register($name: String!, $email: Email!, $password: Password!) {
  register(request: {name: $name, email: $email, password: $password}) {
    name
    slug
  }
}"

fn login() {
  let res =
    gleamql.new()
    |> gleamql.set_query(query_login)
    |> gleamql.set_operation_name("Login")
    |> gleamql.set_variable("email", json.string("test@test.fr"))
    |> gleamql.set_variable("password", json.string("testpass"))
    |> gleamql.set_uri(get_url() <> "/graphql")
    |> gleamql.set_header("Content-Type", "application/json")

  let user_decoder = {
    use name <- decode.field("name", decode.string)
    // use email <- decode.field("email", decode.string)
    use slug <- decode.field("slug", decode.string)
    // use id <- decode.field("email", decode.int)
    decode.success(user.User(id: 0, name:, slug:, email: ""))
  }

  let login_decoder = {
    use user <- decode.field("login", user_decoder)
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
        case res {
          Ok(v) -> Ok(v)
          Error(e) -> {
            io.debug(e)
            Error(e)
          }
        }
      },
    ),
  )
}

fn register() {
  let res =
    gleamql.new()
    |> gleamql.set_query(query_register)
    |> gleamql.set_operation_name("Login")
    |> gleamql.set_variable("name", json.string("test"))
    |> gleamql.set_variable("email", json.string("test@test.fr"))
    |> gleamql.set_variable("password", json.string("testpass"))
    |> gleamql.set_uri(get_url() <> "/graphql")
    |> gleamql.set_header("Content-Type", "application/json")

  let user_decoder = {
    use name <- decode.field("name", decode.string)
    use email <- decode.field("email", decode.string)
    use slug <- decode.field("email", decode.string)
    use id <- decode.field("email", decode.int)
    decode.success(user.User(id:, name:, slug:, email:))
  }

  let login_decoder = {
    use user <- decode.field("register", user_decoder)
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
        case res {
          Ok(v) -> Ok(v)
          Error(e) -> {
            io.debug(e)
            Error(e)
          }
        }
      },
    ),
  )
}

// pub fn main() {
//   let app = lustre.simple(init, update, view)
//   let assert Ok(_) = lustre.start(app, "#app", Nil)
// }

pub type Model {
  Model(hello: Option(others.Login), action: Action)
}

pub fn init(_flags) -> #(Model, Effect(Msg)) {
  #(Model(hello: None, action: authaction.ActionLogin), effect.none())
}

pub fn update(model: Model, msg: Msg) -> #(Model, Effect(shared.Msg)) {
  case msg {
    authmsg.AuthSwitchAction(_) -> todo
    authmsg.Authenticate -> {
      #(
        model,
        effect.map(
          case model.action {
            authaction.ActionLogin -> login()
            authaction.ActionRegister -> register()
          },
          fn(res) {
            case res {
              Ok(usr) -> shared.AuthMessage(authmsg.LoginResponse(usr))
              Error(err) -> {
                io.debug("Hi mum")
                io.debug(err)
                panic
              }
            }
          },
        ),
      )
    }
    authmsg.LoginResponse(_) -> todo
  }
}

pub fn sign_up_card_with_value_props(model: Model) {
  html.div(
    [
      attribute.class(
        "flex h-full w-full flex-wrap items-center justify-center gap-12 bg-default-background px-12 py-12 mobile:flex-col mobile:flex-wrap mobile:gap-12 mobile:px-6 mobile:py-12",
      ),
    ],
    [
      html.div(
        [
          attribute.class(
            "max-w-[576px] grow shrink-0 basis-0 flex-col items-center justify-center gap-12 self-stretch mobile:h-auto mobile:w-full mobile:max-w-[576px] mobile:flex-none",
          ),
        ],
        [
          html.img([
            attribute.src(
              "https://res.cloudinary.com/subframe/image/upload/v1711417518/shared/fdb8rlpzh1gds6vzsnt0.svg",
            ),
            attribute.class("h-8 flex-none object-cover"),
          ]),
          html.div(
            [
              attribute.class(
                "flex flex-col items-center justify-center gap-6 px-12 mobile:flex mobile:px-0 mobile:py-0",
              ),
            ],
            [
              feature(
                "FeatherLightbulb",
                "Spark your imagination",
                "Dive into a world where your creative ideas are instantly brought to life. Let’s paint your thoughts in digital strokes.",
              ),
              feature(
                "FeatherRocket",
                "Simplify the complex",
                "Say goodbye to mundane tasks. Our AI streamlines your workflow, freeing you to focus on what truly matters.",
              ),
              feature(
                "FeatherZap",
                "Boost your brainpower",
                "Elevate your learning with tailored insights and resources. It’s like having a personal coach in your pocket.",
              ),
            ],
          ),
        ],
      ),
      html.div(
        [
          attribute.class(
            "max-w-[448px] grow shrink-0 basis-0 flex-col items-center justify-center gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-12 py-12 shadow-lg",
          ),
        ],
        [
          html.span(
            [
              attribute.class(
                "w-full text-heading-3 font-heading-3 text-default-font",
              ),
            ],
            [html.text("Create your account")],
          ),
          form_field("Name ", ""),
          form_field("Email ", ""),
          form_field("Password ", ""),
          html.button(
            [
              event.on_click(
                shared.AuthMessage(case model.action {
                  authaction.ActionLogin -> authmsg.Authenticate
                  authaction.ActionRegister -> authmsg.Authenticate
                }),
              ),
            ],
            [html.text("Create account")],
          ),
          html.div([attribute.class("flex flex-wrap items-start gap-1")], [
            html.span(
              [attribute.class("text-body font-body text-default-font")],
              [
                html.text(case model.action {
                  authaction.ActionLogin -> "No account yet?"
                  authaction.ActionRegister -> "Have an account?"
                }),
              ],
            ),
            html.a(
              [
                event.on_click(case model.action {
                  authaction.ActionLogin ->
                    shared.AuthMessage(authmsg.AuthSwitchAction(
                      authaction.ActionRegister,
                    ))
                  authaction.ActionRegister ->
                    shared.AuthMessage(authmsg.AuthSwitchAction(
                      authaction.ActionLogin,
                    ))
                }),
              ],
              [
                html.text(case model.action {
                  authaction.ActionLogin -> "Sign Up"
                  authaction.ActionRegister -> "Sign In"
                }),
              ],
            ),
          ]),
        ],
      ),
    ],
  )
}

fn feature(icon_name: String, title: String, description: String) {
  html.div(
    [attribute.class("flex items-start justify-center gap-4 px-2 py-2")],
    [
      // icon.render(icon_name, [attribute.class("text-heading-2 font-heading-2 text-brand-700")]),
      html.div([attribute.class("flex flex-col items-start gap-1")], [
        html.span(
          [attribute.class("text-heading-3 font-heading-3 text-brand-700")],
          [html.text(title)],
        ),
        html.span([attribute.class("text-body font-body text-subtext-color")], [
          html.text(description),
        ]),
      ]),
    ],
  )
}

fn form_field(label: String, value: String) {
  html.div([attribute.class("h-auto w-full flex-none")], [
    html.div([], [
      html.label([], [html.text(label)]),
      html.input([attribute.value(value)]),
    ]),
  ])
}

pub fn view(model: Model) {
  // let handle_switch_auth_action = fn(event) {
  //   use key_code <- decode.field("key", decode.string)
  //   case key_code {
  //     "Enter" -> {
  //       let guest_slug =
  //         model.new_guest_name
  //         |> string.replace("  -")
  //         |> string.lowercase
  //       Ok(
  //         UserAddedNewGuest(Guest(name: model.new_guest_name, slug: guest_slug)),
  //       )
  //     }
  //     _ -> {
  //       use value <- result.try(event.value(event))
  //       Ok(shared.AuthMessage(value))
  //     }
  //   }
  // }

  sign_up_card_with_value_props(model)
  // html.div(
  //   [
  //     attribute.class(
  //       "min-h-screen bg-gray-100 flex flex-col justify-center sm:py-12",
  //     ),
  //   ],
  //   [
  //     html.div([attribute.class("p-10 xs:p-0 mx-auto md:w-full md:max-w-md")], [
  //       html.h1(
  //         [
  //           attribute.class("font-bold text-center text-2xl mb-5"),
  //           event.on_click(case model.action {
  //             authaction.ActionLogin ->
  //               shared.AuthMessage(authmsg.AuthSwitchAction(
  //                 authaction.ActionRegister,
  //               ))
  //             authaction.ActionRegister ->
  //               shared.AuthMessage(authmsg.AuthSwitchAction(
  //                 authaction.ActionLogin,
  //               ))
  //           }),
  //         ],
  //         [
  //           html.text(case model.action {
  //             authaction.ActionLogin -> "login"
  //             authaction.ActionRegister -> "register"
  //           }),
  //         ],
  //       ),
  //       html.div(
  //         [
  //           attribute.class(
  //             "bg-white shadow w-full rounded-lg divide-y divide-gray-200",
  //           ),
  //         ],
  //         [
  //           html.div([attribute.class("px-5 py-7")], [
  //             html.label(
  //               [
  //                 attribute.class(
  //                   "font-semibold text-sm text-gray-600 pb-1 block",
  //                 ),
  //               ],
  //               [html.text("E-mail")],
  //             ),
  //             html.input([
  //               attribute.class(
  //                 "border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full",
  //               ),
  //             ]),
  //             html.label(
  //               [
  //                 attribute.class(
  //                   "font-semibold text-sm text-gray-600 pb-1 block",
  //                 ),
  //               ],
  //               [html.text("Password")],
  //             ),
  //             html.input([
  //               attribute.class(
  //                 "border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full",
  //               ),
  //             ]),
  //             html.button(
  //               [
  //                 attribute.class(
  //                   "transition duration-200 bg-blue-400 hover:bg-blue-600 focus:bg-blue-700 focus:shadow-sm focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 text-white w-full py-2.5 rounded-lg text-sm shadow-sm hover:shadow-md font-semibold text-center inline-block",
  //                 ),
  //               ],
  //               [
  //                 html.span([attribute.class("inline-block mr-2"), event.on("click", handle_submit)], [
  //                   html.text("Login"),
  //                 ]),
  //                 html.svg([attribute.class("w-4 h-4 inline-block")], [
  //                   //   html.path(
  //                 //     [
  //                 //       attribute.class(
  //                 //         "stroke-linecap stroke-linejoin stroke-width-2",
  //                 //       ),
  //                 //     ],
  //                 //     [html.attribute("d M17 8l4 4m0 0l-4 4m4-4H3")],
  //                 //   ),
  //                 ]),
  //               ],
  //             ),
  //           ]),
  //           html.div([attribute.class("p-5")], [
  //             html.div([attribute.class("grid grid-cols-2 gap-1")], [
  //               html.button(
  //                 [
  //                   attribute.class(
  //                     "transition duration-200 border border-gray-200 text-gray-500 w-full py-2.5 rounded-lg text-sm shadow-sm hover:shadow-md font-normal text-center inline-block",
  //                   ),
  //                 ],
  //                 [html.text("Google")],
  //               ),
  //               html.button(
  //                 [
  //                   attribute.class(
  //                     "transition duration-200 border border-gray-200 text-gray-500 w-full py-2.5 rounded-lg text-sm shadow-sm hover:shadow-md font-normal text-center inline-block",
  //                   ),
  //                 ],
  //                 [html.text("Github")],
  //               ),
  //             ]),
  //           ]),
  //           html.div([attribute.class("py-5")], [
  //             html.div([attribute.class("grid grid-cols-2 gap-1")], [
  //               html.div(
  //                 [
  //                   attribute.class(
  //                     "text-center sm:text-left whitespace-nowrap",
  //                   ),
  //                 ],
  //                 [
  //                   html.button(
  //                     [
  //                       attribute.class(
  //                         "transition duration-200 mx-5 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-200 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 ring-inset",
  //                       ),
  //                     ],
  //                     [
  //                       html.svg(
  //                         [
  //                           attribute.class(
  //                             "w-4 h-4 inline-block align-text-top",
  //                           ),
  //                         ],
  //                         [
  //                           //   html.path(
  //                         //     [
  //                         //       attribute.class(
  //                         //         "stroke-linecap stroke-linejoin stroke-width-2",
  //                         //       ),
  //                         //     ],
  //                         //     [
  //                         //       html.attribute(
  //                         //         "d",
  //                         //         "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z",
  //                         //       ),
  //                         //     ],
  //                         //   ),
  //                         ],
  //                       ),
  //                       html.span([attribute.class("inline-block ml-1")], [
  //                         html.text("Forgot Password"),
  //                       ]),
  //                     ],
  //                   ),
  //                 ],
  //               ),
  //               html.div(
  //                 [
  //                   attribute.class(
  //                     "text-center sm:text-right whitespace-nowrap",
  //                   ),
  //                 ],
  //                 [
  //                   html.button(
  //                     [
  //                       attribute.class(
  //                         "transition duration-200 mx-5 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-200 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 ring-inset",
  //                       ),
  //                     ],
  //                     [
  //                       html.svg(
  //                         [
  //                           attribute.class(
  //                             "w-4 h-4 inline-block align-text-bottom",
  //                           ),
  //                         ],
  //                         [
  //                           //   html.path(
  //                         //     [
  //                         //       attribute.class(
  //                         //         "stroke-linecap stroke-linejoin stroke-width-2",
  //                         //       ),
  //                         //     ],
  //                         //     [
  //                         //       html.attribute(
  //                         //         "d",
  //                         //         "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z",
  //                         //       ),
  //                         //     ],
  //                         //   ),
  //                         ],
  //                       ),
  //                       html.span([attribute.class("inline-block ml-1")], [
  //                         html.text("Help"),
  //                       ]),
  //                     ],
  //                   ),
  //                 ],
  //               ),
  //             ]),
  //           ]),
  //         ],
  //       ),
  //     ]),
  //   ],
  // )
}
