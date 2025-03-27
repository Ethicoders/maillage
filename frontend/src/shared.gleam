import ui/auth/msg as auth_msg
import ui/feed/msg as feed_msg

pub type Msg {
  OnChangeView(view: View)
  AuthMessage(auth_msg.Msg)
  FeedMessage(feed_msg.Msg)
  Noop
}

pub type View {
  Main
  Auth
}
