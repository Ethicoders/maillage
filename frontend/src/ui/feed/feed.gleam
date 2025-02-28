import api/post
import api/service.{get_url}
import gleam/dynamic/decode
import gleam/io
import gleam/json
import gleam/option.{type Option, None, Some}
import gleam/result
import gleamql
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element/html
import lustre_http
import modem
import plinth/javascript/storage
import shared
import ui/components/button
import ui/components/card
import ui/components/field.{form_field}
import ui/components/handle
import ui/components/input
import ui/components/link
import ui/components/username
import ui/feed/msg.{type Msg}

pub type Model {
  Model(posts: List(post.Post))
}

pub fn init(_flags) -> #(Model, Effect(Msg)) {
  #(Model(posts: []), effect.none())
}

pub fn update(model: Model, msg: Msg) -> #(Model, Effect(shared.Msg)) {
  case msg {
    _ -> todo
  }
}

pub fn view(model: Model) {
  get_feed()
}

pub fn social_feed_post(
  avatar: String,
  name: String,
  handle: String,
  timestamp: String,
  comment_count: String,
  like_count: String,
  content: String,
) {
  html.div(
    [
      attribute.class(
        "flex w-full items-start p-6 border-b border-neutral-border",
      ),
    ],
    [
      html.div([attribute.class("flex items-center gap-4")], [
        html.img([
          attribute.class("w-12 h-12 rounded-full"),
          attribute.src(avatar),
        ]),
      ]),
      html.div([attribute.class("flex flex-col items-start flex-1")], [
        html.div(
          [
            attribute.class(
              "flex flex-col items-start gap-1 w-full p-[4px_4px_4px_12px]",
            ),
          ],
          [
            html.div([attribute.class("flex flex-wrap items-center gap-1")], [
              username.view(name),
              handle.view(handle),
              html.text("•"),
              html.span(
                [
                  attribute.class(
                    "text-caption font-caption text-subtext-color",
                  ),
                ],
                [html.text(timestamp)],
              ),
            ]),
            html.div([attribute.class("mt-2")], [html.text(content)]),
            // Add embed here
            html.div(
              [
                attribute.class(
                  "flex gap-4 text-caption text-subtext-color mt-2",
                ),
              ],
              [
                html.span([], [html.text("💬 " <> comment_count)]),
                html.span([], [html.text("❤️ " <> like_count)]),
              ],
            ),
          ],
        ),
      ]),
    ],
  )
}

pub fn get_feed() {
  html.div(
    [
      attribute.class(
        "flex h-full w-full items-start justify-center bg-default-background px-6 mobile:px-0 mobile:pt-0 mobile:pb-12",
      ),
    ],
    [
      html.div(
        [
          attribute.class(
            "flex max-w-[576px] grow shrink-0 basis-0 flex-col items-start border-x border-solid border-neutral-border overflow-auto",
          ),
        ],
        [
          html.div(
            [
              attribute.class(
                "flex h-20 w-full flex-none items-center border-b border-solid border-neutral-border px-6 py-6",
              ),
            ],
            [
              html.span(
                [attribute.class("text-heading-3 font-heading-3 font-bold")],
                [html.text("For You")],
              ),
            ],
          ),
          social_feed_post(
            "https://res.cloudinary.com/subframe/image/upload/v1718919568/uploads/3102/mmfbvgi9hwpewyqglgul.png",
            "Subframe",
            "@subframeapp",
            "2h ago",
            "4",
            "72",
            "Watch how to get started with Subframe in just a few minutes",
          ),
          social_feed_post(
            "https://res.cloudinary.com/subframe/image/upload/v1711417512/shared/m0kfajqpwkfief00it4v.jpg",
            "Dr. Jane Foster",
            "@drjanefoster",
            "6h ago",
            "9",
            "34",
            "New research alert! 🧠  📊\n\nOur team's study on neuroplasticity in adults over 60 has been published in @NatureNeurosci.\n\nKey findings:\n1. Cognitive training increased gray matter volume\n2. Improvements sustained at 6-month follow-up\n3. Never too late to teach an old brain new tricks!",
          ),
          social_feed_post(
            "https://res.cloudinary.com/subframe/image/upload/v1711417513/shared/kwut7rhuyivweg8tmyzl.jpg",
            "Jake Turner",
            "@jaketurner4982",
            "1d ago",
            "2",
            "4",
            "Just finished a 5K run #running",
          ),
        ],
      ),
      html.div(
        [
          attribute.class(
            "flex flex-col items-start gap-2 self-stretch px-6 py-6 mobile:hidden",
          ),
        ],
        [social_suggestions()],
      ),
    ],
  )
}

fn social_suggestions() {
  card.card([
    html.span([attribute.class("font-heading-3 font-bold")], [
      html.text("You may also like"),
    ]),
    html.div([attribute.class("flex flex-col items-start gap-4 w-full")], [
      suggested_user(
        "Chris Morgan",
        "@chrismorgan",
        "https://res.cloudinary.com/subframe/image/upload/v1723780941/uploads/302/qgj6kevv14gw6i48bllb.png",
      ),
      suggested_user(
        "Good Tunes, Inc.",
        "@good_tunes",
        "https://res.cloudinary.com/subframe/image/upload/v1723780941/uploads/302/qgj6kevv14gw6i48bllb.png",
      ),
      suggested_user(
        "Mark",
        "@markmarkmark",
        "https://res.cloudinary.com/subframe/image/upload/v1723780941/uploads/302/qgj6kevv14gw6i48bllb.png",
      ),
    ]),
  ])
}

fn suggested_user(name: String, handle: String, avatar_url: String) {
  html.div([attribute.class("flex w-full items-center gap-4")], [
    html.img([
      attribute.src(avatar_url),
      attribute.alt(name),
      attribute.class("w-10 h-10 rounded-full"),
    ]),
    html.div(
      [attribute.class("flex grow shrink-0 basis-0 flex-col items-start")],
      [username.view(name), handle.view(handle)],
    ),
    button.secondary("Follow", "", shared.Noop),
  ])
}
