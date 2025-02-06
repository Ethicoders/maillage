pub type FeedMsg {
  LoadMore(current_index: Int, count: Int)
  PostsLoaded(posts: List(Post))
}

pub type Post {
  Post(title: String, body: String, author: String)
}
