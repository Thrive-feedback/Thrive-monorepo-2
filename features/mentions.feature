Feature: Mentions
  A Member names a teammate in what they write by typing @ and the teammate's Profile slug. Once
  it is sent, each Profile slug of a Member of the same Workspace reads as the name that Member
  goes by.
  Anyone else's stays plain text. A Mention only makes the text easier to read: it shares
  nothing with the person mentioned and tells them nothing.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    And Cara is a Member of Ann's Workspace
    And Cara has introduced themselves

  @api
  Scenario: Feedback names the teammates it mentions, by the name they go by
    Given Ann has given Ben Feedback: "You and @Cara kept the room with you."
    When Ben looks at the Feedback written to them
    Then Ben reads it mentioning Cara

  @api
  Scenario: A Member of another Workspace is never mentioned
    Given Dan owns a Workspace called "Globex"
    And Ann has given Ben Feedback: "You and @Dan kept the room with you."
    When Ben looks at the Feedback written to them
    Then Ben reads it mentioning nobody

  @api
  Scenario: Mentioning a teammate does not let them read the Feedback
    Given Ann has given Ben Feedback: "You and @Cara kept the room with you."
    When Cara opens the Feedback Ann wrote
    Then Cara is told the Feedback cannot be found

  @api
  Scenario: A Request message names the teammates it mentions
    Given Ben has asked Ann for Feedback: "How did the launch with @Cara go?"
    When Ben looks at the requests they have sent
    Then Ben sees the request mentioning Cara
