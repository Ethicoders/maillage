import shared
import ui/auth/auth
import ui/feed/feed

pub type Model {
  Model(view: shared.View, auth_model: auth.Model, feed_model: feed.Model)
}
