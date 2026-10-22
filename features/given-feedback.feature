Feature: Feedback I've given
  A Member reads back the Feedback they have written — answers to the Asks they were
  sent and Feedback they gave without being asked — newest first. It is their own
  history: nobody else reads it as theirs, whoever else may read each piece.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    And Cara is a Member of Ann's Workspace

  @api
  Scenario: Feedback given unasked is listed for its Giver
    Given Ann has given Ben Feedback on "The customer demo": "You kept the room with you."
    When Ann looks at the Feedback they have given
    Then Ann reads "You kept the room with you." to Ben about "The customer demo"

  @api
  Scenario: An answer is listed for the Member who wrote it
    Given Cara has asked Ben for Feedback on "Running the planning meeting"
    And Ben has answered "You open strongly and keep everyone with you."
    When Ben looks at the Feedback they have given
    Then Ben reads "You open strongly and keep everyone with you." to Cara about "Running the planning meeting"

  @api
  Scenario Outline: Only the Giver finds Feedback among what they have given
    Given Ann has given Ben Feedback on "The customer demo": "You kept the room with you.", shared with everyone in the Workspace
    When <reader> looks at the Feedback they have given
    Then <reader> has given no Feedback

    Examples:
      | reader |
      | Ben    |
      | Cara   |

  @api
  Scenario: The newest piece a Member gave comes first
    Given Ann has given Ben Feedback on "The customer demo": "You kept the room with you."
    And Ann has given Cara Feedback on "The release notes": "They read clearly and they land a day late."
    When Ann looks at the Feedback they have given
    Then Ann reads about "The release notes" before "The customer demo"
