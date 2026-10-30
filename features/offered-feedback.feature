Feature: Offered feedback
  A Member gives one or more teammates Feedback without being asked. It reaches everyone
  it is for, marked as given without a request, and asks nobody anything. Given to
  several, it is one piece of Feedback: each of them reads it and sees who else it was
  for (brain `ADR-0044`). Whoever else the Giver chose to share it with can read it
  too, and nobody else.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace

  @api
  Scenario: A Member gives a teammate Feedback without being asked
    Given Ann has given Ben Feedback: "You kept the room with you."
    When Ben looks at the Feedback written to them
    Then Ben reads "You kept the room with you." from Ann, given without being asked

  @api
  Scenario: Feedback written on a postcard is read on that postcard
    Given Ann has given Ben Feedback on a postcard: "You kept the room with you."
    When Ben opens the Feedback Ann wrote
    Then Ben sees the postcard it was written on

  @api
  Scenario: A postcard carries three stamps at most
    When Ann gives Ben Feedback on a postcard with four stamps: "You kept the room with you."
    Then Ann is told the postcard cannot be sent
    And Ben has been given no Feedback

  @api
  Scenario: Giving Feedback asks nobody anything
    When Ann gives Ben Feedback: "You kept the room with you."
    Then no Feedback request or Ask was made between Ann and Ben

  @api
  Scenario: Feedback given to one Member is not another Member's to read
    Given Cara is a Member of Ann's Workspace
    And Ann has given Ben Feedback: "You kept the room with you."
    When Cara looks at the Feedback written to them
    Then Cara has no Feedback written to them

  @api
  Scenario: A Member cannot give Feedback to someone outside their Workspace
    Given Dan owns a Workspace called "Globex"
    When Ann gives Dan Feedback: "You kept the room with you."
    Then Ann is told Dan is not in their Workspace to give Feedback to

  @api
  Scenario Outline: Feedback given unasked reaches the people its Giver chose
    Given Cara is a Member of Ann's Workspace
    And Ann has given Ben Feedback: "You kept the room with you.", shared with <audience>
    When <reader> opens the Feedback Ann wrote
    Then <reader> reads "You kept the room with you." written by Ann

    Examples:
      | audience                  | reader |
      | nobody else               | Ben    |
      | nobody else               | Ann    |
      | Cara                      | Cara   |
      | everyone in the Workspace | Cara   |

  @api
  Scenario Outline: Feedback given unasked reaches nobody its Giver did not choose
    Given Cara is a Member of Ann's Workspace
    And Dan is a Member of Ann's Workspace
    And Ann has given Ben Feedback: "You kept the room with you.", shared with <audience>
    When Cara opens the Feedback Ann wrote
    Then Cara is told the Feedback cannot be found

    Examples:
      | audience    |
      | nobody else |
      | Dan         |

  @api
  Scenario: Feedback given unasked cannot be shared outside the Workspace
    Given Dan owns a Workspace called "Globex"
    When Ann gives Ben Feedback: "You kept the room with you.", shared with Dan
    Then Ann is told they can only share it inside their Workspace

  @api
  Scenario: A Member gives Feedback to several teammates at once
    Given Cara is a Member of Ann's Workspace
    When Ann gives Ben and Cara Feedback: "You two kept the demo calm."
    Then Ben finds "You two kept the demo calm." from Ann, written to them and Cara
    And Cara finds "You two kept the demo calm." from Ann, written to them and Ben

  @api
  Scenario: Feedback given to several is one piece, naming everyone it is for
    Given Cara is a Member of Ann's Workspace
    And Ann has given Ben and Cara Feedback: "You two kept the demo calm."
    When Cara opens the Feedback Ann wrote
    Then Cara reads it as written by Ann to Ben and Cara

  @api
  Scenario: Feedback given to several is still nobody else's to read
    Given Cara is a Member of Ann's Workspace
    And Dan is a Member of Ann's Workspace
    And Ann has given Ben and Cara Feedback: "You two kept the demo calm."
    When Dan opens the Feedback Ann wrote
    Then Dan is told the Feedback cannot be found

  @api
  Scenario: One teammate outside the Workspace stops the whole send
    Given Dan owns a Workspace called "Globex"
    When Ann gives Ben and Dan Feedback: "You two kept the demo calm."
    Then Ann is told Dan is not in their Workspace to give Feedback to
    And Ben has been given no Feedback
