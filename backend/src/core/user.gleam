import db/db
import db/user
import gleam/javascript/promise
import gleam/option
import types/email
import types/password

pub fn login(
  email: email.Email,
  password: password.Password,
) -> promise.Promise(Result(user.User, String)) {
  case db.get_db() {
    Ok(connection) -> {
      use res <- promise.await(user.get_by_email(
        connection,
        email.to_string(email),
      ))
      case res {
        Ok(option) ->
          case option {
            option.Some(item) -> {
              case item.password_digest {
                option.Some(password_digest) ->
                  promise.map(
                    password.valid(password, password_digest),
                    fn(is_matching) {
                      case is_matching {
                        True -> Ok(item)
                        False -> Error("Invalid password")
                      }
                    },
                  )
                option.None -> promise.resolve(Error(""))
              }
            }
            option.None -> promise.resolve(Error("User not found"))
          }
        Error(e) -> promise.resolve(Error(""))
      }
    }
    Error(_) -> promise.resolve(Error("Database connection failed"))
  }
}
