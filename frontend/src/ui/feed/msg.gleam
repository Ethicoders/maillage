import api/post

pub type Msg {
  AppendPosts(List(post.Post))
}
