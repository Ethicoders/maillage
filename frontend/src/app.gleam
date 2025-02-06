import feed/msg
import feed/state.{type FeedState}
import gleam/option.{type Option}

pub type Model {
  Model(feed_state: FeedState)
}

pub type Msg {
  UserClickedRefresh
  FeedMsg(msg: msg.FeedMsg)
}
