pub type Color {
  Primary
  Secondary
  Accent
  Neutral
  Danger
  Warning
  Success
  Custom(c: String)
  None
}

fn to_string(color: Color) -> String {
  case color {
    Accent -> todo
    Custom(c) -> todo
    Danger -> todo
    Neutral -> todo
    Primary -> todo
    Secondary -> todo
    Success -> todo
    Warning -> todo
    None -> todo
  }
}
