import api/user

pub type Action {
  ActionLogin
  ActionRegister
}

pub type Msg {
  AuthSwitchAction(Action)
  LoginResponse(user.AuthenticatedUser)
  Authenticate
}
