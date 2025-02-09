import ui/auth/msg as auth_msg

pub type Msg {
  OnChangeView(view: View)
  AuthMessage(auth_msg.Msg)
}

pub type View {
  Main
  Auth
}
