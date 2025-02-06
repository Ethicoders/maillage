import feed/msg.{type Post}

pub type FeedState {
  FeedState(from: Int, to: Int, posts: List(Post))
}
