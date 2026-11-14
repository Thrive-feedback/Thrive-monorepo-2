Feature: Being told inside Thrive
  Every Member is told when somebody asks them for Feedback, answers a request they
  sent, writes Feedback to them, or gives them Kudos — with no chat tool connected, nothing linked and
  no setting to find. It is the floor under the direct messages, not an alternative
  to them. A Notification names who did something and what it concerns, and carries
  none of the words. Nobody sees anybody else's, and nobody is told about their own
  action.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace

  @api
  Scenario: Somebody asked for Feedback is told, without linking anything
    When Ann asks Ben for Feedback: "Running the planning meeting"
    Then Ben is told that Ann asked them for Feedback
    And Ben has 1 unread notification

  @api
  Scenario: The Notification carries none of what was written
    When Ann asks Ben for Feedback: "Running the planning meeting"
    Then nothing Ben is told carries "Running the planning meeting"

  @api
  Scenario: Nobody is told about their own action
    When Ann asks Ben for Feedback: "Running the planning meeting"
    Then Ann has 0 unread notifications

  @api
  Scenario: The Member who asked is told when their request is answered
    Given Ann has asked Ben for Feedback: "Running the planning meeting"
    When Ben answers "You open strongly and lose the room at the detail."
    Then Ann is told that Ben answered their request
    And nothing Ann is told carries "lose the room"

  @api
  Scenario: Somebody is told when Feedback is written to them
    When Ann gives Ben Feedback: "You kept the room with you."
    Then Ben is told that Ann wrote Feedback to them

  @api
  Scenario: Everyone Feedback is written to is told
    Given Cara is a Member of Ann's Workspace
    When Ann gives Ben and Cara Feedback: "You two kept the demo calm."
    Then Ben is told that Ann wrote Feedback to them
    And Cara is told that Ann wrote Feedback to them

  @api
  Scenario: Somebody chosen to see it is told it was shared with them
    Given Cara is a Member of Ann's Workspace
    When Ann gives Ben Feedback: "You kept the room with you.", shared with Cara
    Then Cara is told that Ann shared Feedback with them

  @api
  Scenario: A line says who can read Feedback written to them
    When Ann gives Ben Feedback: "You kept the room with you.", shared with everyone in the Workspace
    Then Ben's line about the Feedback written to them says everyone in the Workspace can read it

  @api
  Scenario: The Member who asked is told who can read the answer
    Given Cara is a Member of Ann's Workspace
    And Ann has asked Ben for Feedback: "Running the planning meeting", shared with Cara
    When Ben answers "You open strongly and lose the room at the detail."
    Then Ann's line about the answer says selected people can read it

  @api
  Scenario: Somebody asked is told when their answer goes on the Workspace feed
    When Ann asks Ben for Feedback: "Running the planning meeting", shared with everyone in the Workspace
    Then Ben's line about being asked says everyone in the Workspace can read it

  @api
  Scenario Outline: Somebody asked is told nothing else of who reads their answer
    Given Cara is a Member of Ann's Workspace
    When Ann asks Ben for Feedback: "Running the planning meeting", shared with <shared with>
    Then Ben's line about being asked says nothing of who can read it

    Examples:
      | shared with  |
      | nobody else  |
      | Cara         |

  @api
  Scenario: Somebody given Kudos is told, and every Member can read it
    Given Ben has introduced themselves
    When Ann gives Kudos: "@Ben carried the launch."
    Then Ben is told that Ann gave them Kudos
    And Ben's line about the Kudos given to them says everyone in the Workspace can read it
    And nothing Ben is told carries "carried the launch"
    And Ann has 0 unread notifications

  @api
  Scenario: A Kudos for the whole Workspace tells nobody in person
    When Ann gives Kudos: "Thank you all for the launch."
    Then Ben has 0 unread notifications
    And Ann has 0 unread notifications

  @api
  Scenario: Reading one clears it from the count, and it stays on the list
    Given Ann has asked Ben for Feedback: "Running the planning meeting"
    When Ben reads the notification waiting for them
    Then Ben has 0 unread notifications
    And Ben still has 1 notification

  @api
  Scenario: Marking everything read clears the count and keeps the lines
    Given Ann has asked Ben for Feedback: "Running the planning meeting"
    And Ann has asked Ben for Feedback: "The retro"
    When Ben marks everything read
    Then Ben has 0 unread notifications
    And Ben still has 2 notifications

  @api
  Scenario: Nobody can read anybody else's
    Given Ann has asked Ben for Feedback: "Running the planning meeting"
    When Ann looks at what they have been told
    Then Ann has 0 unread notifications

  @api
  Scenario: A Deactivated Member has no bell in a Workspace they are no longer in
    Given Cara is a Member of Ann's Workspace
    And Ann has Deactivated Cara
    When Cara looks at what they have been told
    Then Cara is told that Workspace does not exist

  @api
  Scenario: Somebody outside the Workspace has no bell in it either
    Given Cara is signed in
    When Cara looks at what Ann has been told
    Then Cara is told that Workspace does not exist
