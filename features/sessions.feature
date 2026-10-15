Feature: Sessions
  A person signed in with Google stays signed in on the web until they sign out,
  and Thrive always knows who is asking.

  @api
  Scenario: A signed-in person is recognised
    Given Ann is signed in
    When Ann asks who is signed in
    Then Ann is told the session is Ann's

  @api
  Scenario: A signed-in person sees their own Google photo
    Given Ann is signed in
    And Ann's Google account has a photo
    When Ann asks who is signed in
    Then Ann is told the session shows Ann's Google photo

  @api
  Scenario: Signing out ends the session
    Given Ann is signed in
    When Ann signs out
    Then Ann is no longer signed in

  @api
  Scenario: Someone signing in is sent to Google to choose an account
    When a visitor starts signing in with Google
    Then the visitor is sent to Google to choose an account

  @api
  Scenario: Someone who is not signed in is turned away
    When a visitor asks which Workspaces they belong to
    Then the visitor is told to sign in first

  @api
  Scenario: A session that has not been renewed for a day is due to be renewed
    Given Ann signed in more than a day ago
    When Ann asks who is signed in
    Then Ann is told the session is due to be renewed

  @api
  Scenario: Renewing a session keeps the person signed in
    Given Ann signed in more than a day ago
    When Ann's session is renewed
    Then Ann's session is no longer due to be renewed
    And Ann is told the session is Ann's
