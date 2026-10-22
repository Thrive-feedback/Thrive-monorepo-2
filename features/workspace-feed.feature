Feature: The Workspace feed
  The Feedback people chose to show everybody they work with, newest first. Every
  Member of the Workspace reads the same feed, and nobody outside it reads any of it.
  Whatever somebody kept narrower than Everyone never appears.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    And Cara is a Member of Ann's Workspace

  @api
  Scenario: Feedback given to everyone is in the feed of a Member it is not about
    Given Ben has given Cara Feedback: "You kept the room with you.", shared with everyone in the Workspace
    When Ann looks at the Workspace feed
    Then Ann reads "You kept the room with you." from Ben to Cara on the feed

  @api
  Scenario: An answer to a request set to everyone reaches the feed once it is written
    Given Cara has asked Ben for Feedback: "Running the planning meeting", shared with everyone in the Workspace
    When Ann looks at the Workspace feed
    Then the Workspace feed is empty for Ann
    Given Ben has answered "You open strongly and keep everyone with you."
    When Ann looks at the Workspace feed
    Then Ann reads "You open strongly and keep everyone with you." from Ben to Cara on the feed

  @api
  Scenario Outline: Feedback kept narrower than everyone never reaches the feed
    Given Ben has given Cara Feedback: "You kept the room with you.", shared with <audience>
    When Ann looks at the Workspace feed
    Then the Workspace feed is empty for Ann

    Examples:
      | audience    |
      | nobody else |
      | Ann         |

  @api
  Scenario: A Member of another Workspace reads their own feed, never this one
    Given Dan owns a Workspace called "Globex"
    And Eve is a Member of Dan's Workspace
    And Ben has given Cara Feedback: "You kept the room with you.", shared with everyone in the Workspace
    And Dan has given Eve Feedback: "The second paragraph does the work.", shared with everyone in the Workspace
    When Dan looks at the Workspace feed
    Then Dan reads "The second paragraph does the work." from Dan to Eve on the feed

  @api
  Scenario: Somebody outside a Workspace cannot read its feed at all
    Given Ben has given Cara Feedback: "You kept the room with you.", shared with everyone in the Workspace
    When Dan signs in and looks at the feed of Ann's Workspace
    Then Dan is told that Workspace cannot be found

  @api
  Scenario: The newest piece on the feed comes first
    Given Ben has given Cara Feedback: "You kept the room with you.", shared with everyone in the Workspace
    And Cara has given Ben Feedback: "They read clearly and they land a day late.", shared with everyone in the Workspace
    When Ann looks at the Workspace feed
    Then Ann reads "They read clearly and they land a day late." before "You kept the room with you." on the feed
