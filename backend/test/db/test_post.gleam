import db/post
import db/user
import gleam/javascript/promise
import gleeunit
import gleeunit/should
import utils

pub fn main() {
  gleeunit.main()
}

pub fn create_post_test() {
  let name = "testpost"
  let email = "test@test.test1"
  let password = "passpass"
  let content = "This is a first post!"

  utils.with_test_transaction(fn(pool) {
    use user_result <- promise.try_await(user.create(
      pool,
      name,
      email,
      password,
    ))
    use post_result <- promise.map(post.create(
      pool,
      content,
      user_result.id.value,
    ))
    let post = should.be_ok(post_result)
    should.equal(post.content, content)
    Ok(post_result)
  })
}
