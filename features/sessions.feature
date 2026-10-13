Feature: Sessions
  A person signed in with Google stays signed in on the web until they sign out,
  and Thrive always knows who is asking.

  @api
  Scenario: A signed-in person is recognised
    Given Ann is signed in
    When Ann asks who is signed in
    Then Ann is told the session is Ann's

  @api
  Scenario: Signing out ends the session
    Given Ann is signed in
    When Ann signs out
    Then Ann is no longer signed in
