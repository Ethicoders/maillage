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

pub fn get_by_email_test() {
  let name = "test"
  let email = "test@test.test1"
  let password = "passpass"

  utils.with_test_transaction(fn(pool) {
    promise.await(user.create(pool, name, email, password), fn(x) {
      promise.resolve(Ok(""))
    })

    use res <- promise.map(user.get_by_email(pool, email))
    let option = should.be_ok(res)
    let user = should.be_some(option)
    should.equal(user.name, name)
    should.equal(user.email, email)
    res
  })
}
