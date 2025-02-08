import shared
import ui/views/auth

pub type Model {
  Model(view: shared.View, auth_model: auth.Model)
}
