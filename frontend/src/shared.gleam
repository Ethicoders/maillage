import ui/views/authmsg

pub type Msg {
  OnChangeView(view: View)
  AuthMessage(authmsg.Msg)
  AuthResponse(String)
}

pub type View {
  Main
  Auth
}
