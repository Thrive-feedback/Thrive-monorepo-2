Feature: Offered feedback
  A Member gives a teammate Feedback without being asked. It reaches the person it is
  for, marked as given without a request, and asks nobody anything. Whoever else the
  Giver chose to share it with can read it too, and nobody else.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace

  @api
  Scenario: A Member gives a teammate Feedback without being asked
    Given Ann has given Ben Feedback: "You kept the room with you."
    When Ben looks at the Feedback written to them
    Then Ben reads "You kept the room with you." from Ann, given without being asked

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
