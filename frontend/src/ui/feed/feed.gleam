import api/post
import api/service
import api/user
import gleam/dynamic/decode
import gleam/io
import gleam/list
import gleam/result
import gleamql
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element/html
import lustre/element/svg
import lustre_http
import shared
import ui/auth/auth
import ui/components/button
import ui/components/card
import ui/components/handle
import ui/components/username
import ui/feed/msg.{type Msg}

const query_feed = "query Feed {
  feed(request: {}) {
    total
    edges {cursor, node {id, content, author {id, name, slug}}}
  }
}"

fn get_feed() {
  let res =
    service.get_client()
    |> gleamql.set_query(query_feed)
    |> gleamql.set_operation_name("Feed")

  let post_decoder = {
    use id <- decode.field("id", decode.string)
    use content <- decode.field("content", decode.string)
    use author <- decode.field("author", auth.user_decoder())
    decode.success(post.Post(id, content, author))
  }

  let node_decoder = {
    use node <- decode.field("node", post_decoder)
    decode.success(node)
  }

  let edges_decoder = {
    use edges <- decode.field("edges", decode.list(node_decoder))
    decode.success(edges)
  }

  let feed_decoder = {
    use feed <- decode.field("feed", edges_decoder)
    decode.success(feed)
  }

  let final_decoder = {
    use feed <- decode.field("data", feed_decoder)
    decode.success(feed)
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
  Model(posts: List(post.Post))
}

pub fn init(_flags) -> #(Model, Effect(Msg)) {
  let init_posts = [post.Post("0", "Content", user.User("0", "def", "def"))]
  #(
    Model(posts: init_posts),
    effect.map(get_feed(), fn(r) {
      case r {
        Ok(p) -> msg.AppendPosts(p)
        Error(e) -> panic
      }
    }),
  )
}

pub fn update(model: Model, msg: Msg) -> #(Model, Effect(shared.Msg)) {
  case msg {
    msg.AppendPosts(posts) -> {
      io.debug(posts)
      #(Model(posts: list.append(model.posts, posts)), effect.none())
    }
  }
}

pub fn view(model: Model) {
  view_feed(model.posts)
}

pub fn social_feed_post(
  avatar: String,
  name: String,
  handle: String,
  timestamp: String,
  comment_count: String,
  up_count: String,
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
            html.div([attribute.class("flex flex-wrap gap-1")], [
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
                html.span([], [
                  svg.svg(
                    [
                      attribute.attribute(
                        "xmlns:xlink",
                        "http://www.w3.org/1999/xlink",
                      ),
                      attribute.attribute("xmlns", "http://www.w3.org/2000/svg"),
                      attribute.attribute("xml:space", "preserve"),
                      attribute.attribute("width", "20"),
                      attribute.attribute("viewBox", "0 0 32 32"),
                      attribute.attribute("version", "1.1"),
                      attribute.attribute("height", "20"),
                      attribute.attribute("enable-background", "new 0 0 32 32"),
                      attribute.class("inline mr-2 cursor-pointer"),
                    ],
                    [
                      svg.g([attribute.id("bubble")], [
                        svg.path([
                          attribute.attribute("fill-rule", "evenodd"),
                          attribute.attribute("fill", "#f9fafb"),
                          attribute.attribute(
                            "d",
                            "M16,7c-5.963,0-11,3.206-11,7c0,0.276,0.224,0.5,0.5,0.5   S6,14.276,6,14c0-3.196,4.673-6,10-6c0.275,0,0.5-0.224,0.5-0.5S16.276,7,16,7z",
                          ),
                          attribute.attribute("clip-rule", "evenodd"),
                        ]),
                        svg.path([
                          attribute.attribute("fill-rule", "evenodd"),
                          attribute.attribute("fill", "#f9fafb"),
                          attribute.attribute(
                            "d",
                            "M16,2C7.163,2,0,7.373,0,14c0,4.127,2.779,7.766,7.008,9.926   C7.008,23.953,7,23.971,7,24c0,1.793-1.339,3.723-1.928,4.736c0.001,0,0.002,0,0.002,0C5.027,28.846,5,28.967,5,29.094   C5,29.594,5.405,30,5.906,30C6,30,6.165,29.975,6.161,29.986c3.125-0.512,6.069-3.383,6.753-4.215C13.913,25.918,14.943,26,16,26   c8.835,0,16-5.373,16-12C32,7.373,24.836,2,16,2z M16,24c-0.917,0-1.858-0.07-2.796-0.207c-0.097-0.016-0.194-0.021-0.29-0.021   c-0.594,0-1.163,0.264-1.546,0.73c-0.428,0.521-1.646,1.684-3.085,2.539c0.39-0.895,0.695-1.898,0.716-2.932   c0.006-0.064,0.009-0.129,0.009-0.184c0-0.752-0.421-1.439-1.09-1.781C4.212,20.252,2,17.207,2,14C2,8.486,8.28,4,16,4   c7.718,0,14,4.486,14,10C30,19.514,23.719,24,16,24z",
                          ),
                          attribute.attribute("clip-rule", "evenodd"),
                        ]),
                      ]),
                    ],
                  ),
                  html.text(comment_count),
                ]),
                html.span([], [
                  html.svg(
                    [
                      attribute.attribute("viewBox", "0 0 448 512"),
                      attribute.attribute("height", "20"),
                      attribute.attribute("width", "20"),
                      attribute.attribute("fill", "#2A935B"),
                      attribute.class("inline mr-2 cursor-pointer"),
                    ],
                    [
                      svg.path([
                        attribute.attribute(
                          "d",
                          "M376 192c-6.428 0-12.66 .8457-18.6 2.434C344.7 173.8 321.9 160 296 160c-6.428 0-12.66 .8457-18.6 2.434C264.7 141.8 241.9 128 216 128C213.3 128 210.6 128.1 208 128.4V72C208 32.3 175.7 0 136 0S64 32.3 64 72v196.3C44.51 284.5 32 308.8 32 336v49.88c0 32.1 17.1 61.65 44.63 77.12l55.83 31.35C153.1 505.9 176.4 512 199.8 512h107.9C385.1 512 448 447.4 448 368V264C448 224.3 415.7 192 376 192zM272 232c0-13.23 10.78-24 24-24S320 218.8 320 232v47.91C320 293.1 309.2 304 296 304S272 293.2 272 280V232zM192 200C192 186.8 202.8 176 216 176s24 10.77 24 24v48c0 3.029-.7012 5.875-1.73 8.545C227.9 251.3 216.4 248 204 248H192V200zM112 72c0-13.23 10.78-24 24-24S160 58.77 160 72v176H120c-2.686 0-5.217 .5566-7.84 .793C112.2 248.5 112 248.3 112 248V72zM307.7 464H199.8c-15.25 0-30.41-3.984-43.88-11.52l-55.78-31.34C87.72 414.2 80 400.6 80 385.9V336c0-22.06 17.94-40 40-40h84c15.44 0 28 12.56 28 28S219.4 352 204 352H152C138.8 352 128 362.8 128 376s10.75 24 24 24h52c33.23 0 61.25-21.58 71.54-51.36C282 350.7 288.9 352 296 352c5.041 0 9.836-1.166 14.66-2.178C322 374.6 346.1 392 376 392c7.684 0 14.94-1.557 21.87-3.836C388.9 431.4 351.9 464 307.7 464zM400 320c0 13.23-10.78 24-24 24S352 333.2 352 320V264c0-13.23 10.78-24 24-24s24 10.77 24 24V320z",
                        ),
                      ]),
                    ],
                  ),
                  html.text(up_count),
                ]),
              ],
            ),
          ],
        ),
      ]),
    ],
  )
}

pub fn view_feed(posts: List(post.Post)) {
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
          html.div(
            [attribute.class("w-full")],
            list.map(posts, fn(post) {
              social_feed_post(
                "https://res.cloudinary.com/subframe/image/upload/v1718919568/uploads/3102/mmfbvgi9hwpewyqglgul.png",
                post.author.name,
                post.author.slug,
                "2h ago",
                "4",
                "72",
                post.content,
              )
            }),
          ),
          // social_feed_post(
        //   "https://res.cloudinary.com/subframe/image/upload/v1718919568/uploads/3102/mmfbvgi9hwpewyqglgul.png",
        //   "Subframe",
        //   "@subframeapp",
        //   "2h ago",
        //   "4",
        //   "72",
        //   "Watch how to get started with Subframe in just a few minutes",
        // ),
        // social_feed_post(
        //   "https://res.cloudinary.com/subframe/image/upload/v1711417512/shared/m0kfajqpwkfief00it4v.jpg",
        //   "Dr. Jane Foster",
        //   "@drjanefoster",
        //   "6h ago",
        //   "9",
        //   "34",
        //   "New research alert! 🧠  📊\n\nOur team's study on neuroplasticity in adults over 60 has been published in @NatureNeurosci.\n\nKey findings:\n1. Cognitive training increased gray matter volume\n2. Improvements sustained at 6-month follow-up\n3. Never too late to teach an old brain new tricks!",
        // ),
        // social_feed_post(
        //   "https://res.cloudinary.com/subframe/image/upload/v1711417513/shared/kwut7rhuyivweg8tmyzl.jpg",
        //   "Jake Turner",
        //   "@jaketurner4982",
        //   "1d ago",
        //   "2",
        //   "4",
        //   "Just finished a 5K run #running",
        // ),
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
