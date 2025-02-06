import app.{type Msg}
import feed/msg.{type FeedMsg}
import feed/state.{type FeedState, FeedState}
import gleam/int
import gleam/io
import gleam/list
import lustre/effect.{type Effect}
import lustre/element
import lustre/element/html

pub fn init() -> #(FeedState, Effect(Msg)) {
  #(FeedState(0, 10, []), load_msg(0, 10))
}

pub fn update(state: FeedState, msg: FeedMsg) -> #(FeedState, Effect(Msg)) {
  case msg {
    // We retrieve the 1O firsts posts for the first loading
    msg.LoadMore(from, to) -> #(state, load_msg(from, to))
    // Posts are loaded as Post type, so add them into the current state
    msg.PostsLoaded(posts) -> {
      let m = append_posts_to_state(state, posts)
      #(m, effect.none())
    }
  }
}

pub fn render(state: FeedState) {
  html.div(
    [],
    state.posts
      |> list.map(fn(post: msg.Post) {
        html.div([], [
          html.h2([], [html.text(post.title)]),
          html.p([], [html.text(post.body)]),
          html.p([], [html.text("Posted by " <> post.author)]),
        ])
      }),
  )
}

fn load_msg(from: Int, to: Int) -> Effect(Msg) {
  effect.from(fn(dispatch) {
    get_random_posts(from, to)
    |> msg.PostsLoaded
    |> app.FeedMsg
    |> dispatch
  })
}

fn get_random_posts(from: Int, to: Int) -> List(msg.Post) {
  list.range(from, to - 1)
  |> list.map(fn(i: Int) -> msg.Post {
    msg.Post(
      title: "Titre " <> int.to_string(i),
      body: "body",
      author: "Cédric",
    )
  })
}

fn append_posts_to_state(
  current: FeedState,
  to_add: List(msg.Post),
) -> FeedState {
  FeedState(
    ..current,
    to: current.to + list.length(to_add),
    posts: current.posts |> list.append(to_add),
  )
}
