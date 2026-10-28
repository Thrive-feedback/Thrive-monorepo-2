Feature: Feedback shared with me
  A Member reads the Feedback somebody chose to show them — what a Requester shared of
  the answers they collected, and what a Giver shared of the Feedback they gave. Only
  what they were selected for, and nothing else of their Workspace's.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    And Cara is a Member of Ann's Workspace

  @api
  Scenario: Feedback given unasked reaches the person its Giver shared it with
    Given Ben has given Cara Feedback: "You kept the room with you.", shared with Ann
    When Ann looks at the Feedback shared with them
    Then Ann reads "You kept the room with you." from Ben to Cara

  @api
  Scenario: An answer reaches the person its Requester shared it with
    Given Cara has asked Ben for Feedback: "Running the planning meeting", shared with Ann
    And Ben has answered "You open strongly and keep everyone with you."
    When Ann looks at the Feedback shared with them
    Then Ann reads "You open strongly and keep everyone with you." from Ben to Cara

  @api
  Scenario: An answer shared with a Member says what was asked and everyone who was asked
    Given Dan is a Member of Ann's Workspace
    And Cara has asked Ben and Dan for Feedback: "Running the planning meeting", shared with Ann
    And Ben has answered "You open strongly and keep everyone with you."
    When Ann looks at the Feedback shared with them
    Then Ann reads in the Feedback shared with them that "You open strongly and keep everyone with you." answers Cara, who asked Ben and Dan: "Running the planning meeting"

  @api
  Scenario Outline: Feedback nobody was selected for is shared with nobody
    Given Ben has given Cara Feedback: "You kept the room with you.", shared with <audience>
    When Ann looks at the Feedback shared with them
    Then Ann has no Feedback shared with them

    Examples:
      | audience                  |
      | nobody else               |
      | everyone in the Workspace |

  @api
  Scenario: Feedback shared with one Member is not another Member's to read
    Given Dan is a Member of Ann's Workspace
    And Ben has given Cara Feedback: "You kept the room with you.", shared with Dan
    When Ann looks at the Feedback shared with them
    Then Ann has no Feedback shared with them

  @api
  Scenario: A Giver does not find their own Feedback among what is shared with them
    Given Ben has given Cara Feedback: "You kept the room with you.", shared with Ann
    When Ben looks at the Feedback shared with them
    Then Ben has no Feedback shared with them

  @api
  Scenario: A Receiver does not find their own Feedback among what is shared with them
    Given Ben has given Cara Feedback: "You kept the room with you.", shared with Ann
    When Cara looks at the Feedback shared with them
    Then Cara has no Feedback shared with them

  @api
  Scenario: Feedback shared inside another Workspace stays there
    Given Dan owns a Workspace called "Globex"
    And Ben has given Cara Feedback: "You kept the room with you.", shared with Ann
    When Dan looks at the Feedback shared with them
    Then Dan has no Feedback shared with them

  @api
  Scenario: The newest piece shared with a Member comes first
    Given Ben has given Cara Feedback: "You kept the room with you.", shared with Ann
    And Cara has given Ben Feedback: "They read clearly and they land a day late.", shared with Ann
    When Ann looks at the Feedback shared with them
    Then Ann reads "They read clearly and they land a day late." before "You kept the room with you."
