import api/user
import ui/views/authaction

// import ui/views/others

pub type Msg {
  // LoginView
  // RegisterView
  AuthSwitchAction(authaction.Action)
  LoginResponse(user.User)
  Authenticate
}
