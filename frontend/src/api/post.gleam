import api/user

pub type Post {

  Post(id: String, content: String, author: user.User)
}
