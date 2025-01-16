import dummy
import gleeunit
import gleeunit/should

pub fn main() {
  gleeunit.main()
}

pub fn format_pair_test() {
  dummy.format_pair("hello", "world")
  |> should.equal("hello=world")
}
