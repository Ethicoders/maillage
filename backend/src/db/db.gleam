import env
import pog

pub fn get_db() -> Result(pog.Connection, String) {
  case pog.url_config(env.get_env("DATABASE_URL")) {
    Ok(config) -> Ok(pog.connect(config))
    Error(_e) -> Error("")
  }
}
