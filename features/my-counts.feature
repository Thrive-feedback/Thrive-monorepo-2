Feature: The counts beside Waiting for me, Received and Shared with me
  A Member sees how many Asks are still waiting on them, how much is new in each kind of their
  Received — answers to their requests, Feedback given to them unasked, and Kudos naming them — and
  how much Feedback someone has newly selected them to read, Shared with me on Home. The
  counts come from those things themselves, not from the bell, so reading every notification
  leaves them as they were. An Ask stops counting when it is answered; a list stops
  counting when it is opened, and only what arrives after that counts again.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    And Cara is a Member of Ann's Workspace
    And Ben has introduced themselves
    And Cara has introduced themselves

  @api
  Scenario: Every Ask still waiting counts, even once the bell is read
    Given Ben has asked Ann for Feedback: "How was my demo?"
    And Cara has asked Ann for Feedback: "How was my plan?"
    And Ann marks everything read
    When Ann looks at their counts
    Then Ann has 2 Asks waiting

  @api
  Scenario: An Ask stops counting when it is answered
    Given Ben has asked Ann for Feedback: "How was my demo?"
    And Ann has answered "It landed well."
    When Ann looks at their counts
    Then Ann has 0 Asks waiting

  @api
  Scenario: Everything in a kind of Received counts until it is opened, whatever the bell says
    Given Cara has given Ann Feedback: "The demo landed well."
    And Cara has given Kudos: "@Ann carried the launch."
    And Ann marks everything read
    When Ann looks at their counts
    Then Ann has 0 new in their requests, 1 new in Feedback given unasked and 1 new in Kudos

  @api
  Scenario: Each answer to the reader's requests counts on its own
    Given Ann has asked Ben and Cara for Feedback: "How clear was the plan?"
    And Ben has answered "Very clear."
    And Cara has answered "Mostly clear."
    When Ann looks at their counts
    Then Ann has 2 new in their requests, 0 new in Feedback given unasked and 0 new in Kudos

  @api
  Scenario: Opening one kind of Received clears only that kind
    Given Ann has asked Ben for Feedback: "How clear was the plan?"
    And Ben has answered "Very clear."
    And Cara has given Ann Feedback: "The demo landed well."
    And Cara has given Kudos: "@Ann carried the launch."
    And Ann has opened Kudos in what they have received
    When Ann looks at their counts
    Then Ann has 1 new in their requests, 1 new in Feedback given unasked and 0 new in Kudos

  @api
  Scenario: What somebody else opened changes nothing for the reader
    Given Cara has given Ann Feedback: "The demo landed well."
    And Cara has given Ben Feedback: "Thanks for the review."
    And Ben has opened Feedback given unasked in what they have received
    When Ann looks at their counts
    Then Ann has 0 new in their requests, 1 new in Feedback given unasked and 0 new in Kudos

  @api
  Scenario: Received cannot be marked opened all at once
    When Ann opens everything in what they have received at once
    Then Received refuses the choice

  @api
  Scenario: Feedback someone selected the reader to read counts until they open what is shared with them
    Given Ben has given Cara Feedback: "You kept the room with you.", shared with Ann
    And Cara has given Ben Feedback: "Clear plan.", shared with everyone in the Workspace
    When Ann looks at their counts
    Then Ann has 1 new shared with them

  @api
  Scenario: Opening what is shared with the reader clears its count
    Given Ben has given Cara Feedback: "You kept the room with you.", shared with Ann
    And Ann has opened what is shared with them
    When Ann looks at their counts
    Then Ann has 0 new shared with them

  @api
  Scenario: Somebody outside the Workspace has no counts in it
    Given Dan is signed in
    When Dan looks at their counts in Ann's Workspace
    Then Dan is told that Workspace does not exist

  @api
  Scenario: Somebody outside the Workspace cannot open a list in it
    Given Dan is signed in
    When Dan opens what is shared with them in Ann's Workspace
    Then Dan is told that Workspace does not exist
