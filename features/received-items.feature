Feature: Received
  A Member reads, in one list, everything that comes back to them: the Feedback they are a Receiver
  of, whoever else can read it, the Kudos that name them, and the requests they sent, each with
  everyone it asked and every answer inside it. Feedback that only mentions them is on Home, and a
  Kudos for the whole Workspace is on the board.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    And Cara is a Member of Ann's Workspace
    And Ben has introduced themselves
    And Cara has introduced themselves

  @api
  Scenario: Feedback and Kudos are read in one list, newest first
    Given Ben has given Ann Feedback: "The plan was clear."
    And Cara has given Kudos: "@Ann carried the launch."
    And Ben has given Ann Feedback: "The demo landed well."
    When Ann looks at what they have received
    Then Ann's Received reads "The demo landed well." then "@Ann carried the launch." then "The plan was clear."

  @api
  Scenario Outline: Feedback written to the reader is there, whoever else can read it
    Given Ben has given Ann Feedback: "Written to Ann.", shared with <audience>
    When Ann looks at what they have received
    Then Ann's Received reads "Written to Ann."

    Examples:
      | audience                  |
      | nobody else               |
      | Cara                      |
      | everyone in the Workspace |

  @api
  Scenario: A request the reader sent is there before anybody answers
    Given Ann has asked Ben and Cara for Feedback: "How clear was the plan?"
    When Ann looks at what they have received
    Then Ann's Received reads "How clear was the plan?"
    And Ben is shown as not having answered yet
    And Cara is shown as not having answered yet

  @api
  Scenario: An answer to the reader's own request is read inside that request, and only there
    Given Ann has asked Ben and Cara for Feedback: "How clear was the plan?"
    And Ben has answered "The order of the steps was clear."
    When Ann looks at what they have received
    Then Ann's Received reads "How clear was the plan?"
    And Ben is shown as having answered "The order of the steps was clear."
    And Cara is shown as not having answered yet

  @api
  Scenario: A request moves up when an answer comes
    Given Ann has asked Ben for Feedback: "How clear was the plan?"
    And Cara has given Ann Feedback: "The demo landed well."
    And Ben has answered "Very clear."
    When Ann looks at what they have received
    Then Ann's Received reads "How clear was the plan?" then "The demo landed well."

  @api
  Scenario: A request somebody else sent is not there, even to someone it asked
    Given Ben has asked Ann for Feedback: "How was my demo?"
    When Ann looks at what they have received
    Then Ann's Received is empty

  @api
  Scenario Outline: Received shows one kind at a time
    Given Ann has asked Ben for Feedback: "How clear was the plan?"
    And Ben has answered "Very clear."
    And Cara has given Ann Feedback: "The demo landed well."
    And Cara has given Kudos: "@Ann carried the launch."
    When Ann looks at what they have received, showing <kind>
    Then Ann's Received reads "<read>"

    Examples:
      | kind                   | read                     |
      | their requests         | How clear was the plan?  |
      | Feedback given unasked | The demo landed well.    |
      | Kudos                  | @Ann carried the launch. |

  @api
  Scenario: Received refuses a kind it does not have
    When Ann looks at what they have received, showing something it does not have
    Then Received refuses the choice

  @api
  Scenario: Feedback is read on the postcard it was written on
    Given Ben has given Ann Feedback on a postcard: "On paper."
    When Ann looks at what they have received
    Then "On paper." is on the postcard it was written on

  @api
  Scenario: An answer is read on the postcard its Giver sent back
    Given Ann has asked Ben for Feedback on a postcard: "How clear was the plan?"
    And Ben has answered on the postcard: "Very clear."
    When Ann looks at what they have received
    Then "How clear was the plan?" is on the postcard it was written on
    And Ben's answer "Very clear." is in its own writing

  @api
  Scenario: A Kudos is read on the card it was written on
    Given Ben has given Kudos on a card: "@Ann carried the launch."
    When Ann looks at what they have received
    Then Ann sees the card the Kudos was written on

  @api
  Scenario Outline: What was not written to the reader is not there
    Given <written>
    When Ann looks at what they have received
    Then Ann's Received is empty

    Examples:
      | written                                                                        |
      | Ben has given Cara Feedback: "To Cara alone."                                  |
      | Ben has given Cara Feedback: "You and @Ann kept the room with you.", shared with Ann |
      | Ann has given Ben Feedback: "From Ann."                                        |
      | Ben has given Kudos: "@Cara carried the launch."                               |
      | Ben has given Kudos: "Great launch, everyone."                                 |
      | Ann has given Kudos: "@Ben carried the launch."                                |

  @api
  Scenario: Received reads to its end, across Feedback and Kudos, with nothing repeated
    Given Ben has given Ann Feedback: "One."
    And Cara has given Kudos: "@Ann two."
    And Ben has given Ann Feedback: "Three."
    When Ann reads Received two at a time to the end
    Then Ann has read "Three." then "@Ann two." then "One." with nothing repeated

  @api
  Scenario: A request that moves up while the reader scrolls is not read twice, and skips nothing
    Given Cara has given Ann Feedback: "One."
    And Ann has asked Ben for Feedback: "How clear was the plan?"
    And Cara has given Ann Feedback: "Three."
    And Ann has read the first two of Received
    And Ben has answered "Very clear."
    When Ann reads the rest of Received two at a time
    Then Ann has read "Three." then "How clear was the plan?" then "One." with nothing repeated

  @api
  Scenario: Somebody outside a Workspace cannot read what was written in it
    Given Dan owns a Workspace called "Globex"
    And Ben has given Ann Feedback: "Written to Ann."
    When Dan signs in and looks at what was received in Ann's Workspace
    Then Dan is told that Workspace cannot be found
