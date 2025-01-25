import db/user
import gleam/javascript/promise
import gleeunit
import gleeunit/should
import utils

pub fn main() {
  gleeunit.main()
}

pub fn create_user_test() {
  let name = "test"
  let email = "test@test.test1"
  let password = "passpass"

  utils.with_test_transaction(fn(pool) {
    use res <- promise.map(user.create(pool, name, email, password))
    let user = should.be_ok(res)
    should.equal(user.name, name)
    should.equal(user.email, email)
    res
  })
}
