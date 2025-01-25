import db/db
import gleam/io
import gleam/javascript/promise
import pog

pub fn with_test_transaction(
  callback: fn(pog.Connection) -> promise.Promise(Result(t, pog.QueryError)),
) -> promise.Promise(Result(String, String)) {
  let pool_result = db.get_db()

  let p = case pool_result {
    Ok(pool) -> {
      pog.transaction(pool, fn(pool) {
        callback(pool)
        promise.resolve(Error(pog.QueryTimeout))
      })
    }
    Error(e) -> {
      io.debug(e)
      promise.resolve(Ok(""))
    }
  }
  use res <- promise.await(p)
  promise.resolve(case res {
    Ok(_) -> Ok("")
    Error(e) -> {
      case e {
        pog.TransactionQueryError(_) -> Error("")
        pog.TransactionRolledBack(_) -> Ok("")
      }
    }
  })
}
