Feature: Received
  A Member reads, in one list, everything written to them: the Feedback they are a Receiver of,
  whoever else can read it, and the Kudos that name them. Feedback that only mentions them is on
  Home, and a Kudos for the whole Workspace is on the board.

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
  Scenario: An answer to the reader's own request says what was asked
    Given Ann has asked Ben for Feedback: "How clear was the plan?"
    And Ben has answered "The order of the steps was clear."
    When Ann looks at what they have received
    Then Ann's Received reads "The order of the steps was clear."
    And it answers "How clear was the plan?", asked by Ann

  @api
  Scenario: Feedback is read on the postcard it was written on
    Given Ben has given Ann Feedback on a postcard: "On paper."
    When Ann looks at what they have received
    Then "On paper." is on the postcard it was written on

  @api
  Scenario: An answer is read on the postcard of the request, in its own writing
    Given Ann has asked Ben for Feedback on a postcard: "How clear was the plan?"
    And Ben has answered on the postcard: "Very clear."
    When Ann looks at what they have received
    Then "Very clear." is on the postcard of the request, in its own writing

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
  Scenario: Somebody outside a Workspace cannot read what was written in it
    Given Dan owns a Workspace called "Globex"
    And Ben has given Ann Feedback: "Written to Ann."
    When Dan signs in and looks at what was received in Ann's Workspace
    Then Dan is told that Workspace cannot be found
