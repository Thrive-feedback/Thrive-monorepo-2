Feature: Mentions
  A Member names a teammate in what they write by typing @ and the teammate's Profile slug. Once
  it is sent, each Profile slug of a Member of the same Workspace reads as the name that Member
  goes by.
  Anyone else's stays plain text. In a Request message or in Feedback given unasked, mentioning
  somebody means they can read it: the writer cannot keep it from them, and is told so before
  anything is sent. In an answer to a request a Mention only makes the text easier to read. A
  Mention tells nobody anything of its own.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    And Cara is a Member of Ann's Workspace
    And Cara has introduced themselves

  @api
  Scenario: Feedback names the teammates it mentions, by the name they go by
    Given Ann has given Ben Feedback: "You and @Cara kept the room with you.", shared with everyone in the Workspace
    When Ben looks at the Feedback written to them
    Then Ben reads it mentioning Cara

  @api
  Scenario: A Member of another Workspace is never mentioned
    Given Dan owns a Workspace called "Globex"
    And Ann has given Ben Feedback: "You and @Dan kept the room with you."
    When Ben looks at the Feedback written to them
    Then Ben reads it mentioning nobody

  @api
  Scenario: A Request message names the teammates it mentions
    Given Ben has asked Ann for Feedback: "How did the launch with @Cara go?", shared with Cara
    When Ben looks at the requests they have sent
    Then Ben sees the request mentioning Cara

  @api
  Scenario Outline: Feedback given unasked cannot leave out a teammate it mentions
    Given Dan is a Member of Ann's Workspace
    When Ann gives Ben Feedback: "You and @Cara kept the room with you.", shared with <sharedWith>
    Then Ann is told everyone it mentions must be able to read it

    Examples:
      | sharedWith  |
      | nobody else |
      | Dan         |

  @api
  Scenario Outline: A request cannot leave out a teammate its message mentions
    Given Dan is a Member of Ann's Workspace
    When Ben asks Ann for Feedback: "How did the launch with @Cara go?", shared with <sharedWith>
    Then Ben is told everyone it mentions must be able to read it

    Examples:
      | sharedWith  |
      | nobody else |
      | Dan         |

  @api
  Scenario: A teammate mentioned in Feedback given unasked can read it
    Given Ann has given Ben Feedback: "You and @Cara kept the room with you.", shared with Cara
    When Cara looks at the Feedback shared with them
    Then Cara reads it mentioning Cara

  @api
  Scenario: Mentioning the people it is for keeps it between them
    Given Ben has introduced themselves
    And Ann has given Ben Feedback: "@Ben kept the room with you.", shared with nobody else
    When Cara opens the Feedback Ann wrote
    Then Cara is told the Feedback cannot be found

  @api
  Scenario: Mentioning a teammate in an answer does not let them read it
    Given Ben has asked Ann for Feedback: "How did the launch go?"
    And Ann has answered "You and @Cara kept the room with you."
    When Cara opens the Feedback Ann wrote
    Then Cara is told the Feedback cannot be found
