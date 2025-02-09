import api/service.{get_url}
import api/user
import gleam/dynamic/decode
import gleam/io
import gleam/json
import gleam/option.{type Option, None, Some}
import gleam/result
import gleamql
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element/html
import lustre/event
import lustre_http
import shared
import ui/auth/msg.{
  type Action, type Msg, ActionLogin, ActionRegister, AuthSwitchAction,
  Authenticate, LoginResponse,
}
import ui/auth/others

pub type Data {
  LoginRequest(name: String)
  RegisterRequest(name: String)
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

pub type Model {
  Model(action: Action)
}

pub fn init(_flags) -> #(Model, Effect(Msg)) {
  #(Model(action: ActionLogin), effect.none())
}

pub fn update(model: Model, msg: Msg) -> #(Model, Effect(shared.Msg)) {
  case msg {
    AuthSwitchAction(_) -> todo
    Authenticate -> {
      #(
        model,
        effect.map(
          case model.action {
            ActionLogin -> login()
            ActionRegister -> register()
          },
          fn(res) {
            case res {
              Ok(usr) -> shared.AuthMessage(LoginResponse(usr))
              Error(err) -> {
                io.debug(err)
                panic
              }
            }
          },
        ),
      )
    }
    LoginResponse(_) -> todo
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
                  ActionLogin -> Authenticate
                  ActionRegister -> Authenticate
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
                  ActionLogin -> "No account yet?"
                  ActionRegister -> "Have an account?"
                }),
              ],
            ),
            html.a(
              [
                event.on_click(case model.action {
                  ActionLogin ->
                    shared.AuthMessage(AuthSwitchAction(ActionRegister))
                  ActionRegister ->
                    shared.AuthMessage(AuthSwitchAction(ActionLogin))
                }),
              ],
              [
                html.text(case model.action {
                  ActionLogin -> "Sign Up"
                  ActionRegister -> "Sign In"
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
  sign_up_card_with_value_props(model)
}
