import shared
import ui/auth/auth

pub type Model {
  Model(view: shared.View, auth_model: auth.Model)
}
