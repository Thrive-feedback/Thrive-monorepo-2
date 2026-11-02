Feature: Given
  A Member reads, in one list, everything they wrote: their Feedback, given unasked or in answer to a
  request, whoever can read it, and every Kudos they gave, to people or to the whole Workspace. What
  they asked for is in My requests.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    And Cara is a Member of Ann's Workspace
    And Ben has introduced themselves
    And Cara has introduced themselves

  @api
  Scenario: Feedback and Kudos are read in one list, newest first
    Given Ann has given Ben Feedback: "The plan was clear."
    And Ann has given Kudos: "@Ben carried the launch."
    And Ann has given Cara Feedback: "The demo landed well."
    When Ann looks at what they have given
    Then Ann's Given reads "The demo landed well." then "@Ben carried the launch." then "The plan was clear."

  @api
  Scenario Outline: Feedback given unasked is there, saying who can read it
    Given Ann has given Ben Feedback: "Written to Ben.", shared with <audience>
    When Ann looks at what they have given
    Then Ann's Given reads "Written to Ben."
    And Ann's Given says it is shared with <audience>

    Examples:
      | audience                  |
      | nobody else               |
      | Cara                      |
      | everyone in the Workspace |

  @api
  Scenario Outline: An answer is there, saying who can read it
    Given Ann has asked Ben for Feedback: "How clear was the plan?", shared with <audience>
    And Ben has answered "The order of the steps was clear."
    When Ben looks at what they have given
    Then Ben's Given reads "The order of the steps was clear."
    And it answers "How clear was the plan?", asked by Ann
    And Ben's Given says it is shared with <audience>

    Examples:
      | audience                  |
      | nobody else               |
      | Cara                      |
      | everyone in the Workspace |

  @api
  Scenario: A Kudos for the whole Workspace is there
    Given Ann has given Kudos: "Great launch, everyone."
    When Ann looks at what they have given
    Then Ann's Given reads "Great launch, everyone."

  @api
  Scenario: Feedback is read on the postcard it was written on
    Given Ann has given Ben Feedback on a postcard: "On paper."
    When Ann looks at what they have given
    Then "On paper." is on the postcard it was written on

  @api
  Scenario: An answer is read on the postcard of the request, in its own writing
    Given Ann has asked Ben for Feedback on a postcard: "How clear was the plan?"
    And Ben has answered on the postcard: "Very clear."
    When Ben looks at what they have given
    Then "Very clear." is on the postcard of the request, in its own writing

  @api
  Scenario: A Kudos is read on the card it was written on
    Given Ann has given Kudos on a card: "@Ben carried the launch."
    When Ann looks at what they have given
    Then Ann sees the card the Kudos was written on

  @api
  Scenario Outline: Another person's answer the reader may not read stays theirs
    Given Dan is a Member of Ann's Workspace
    And Ann has asked Ben and Cara for Feedback: "How clear was the plan?", shared with <audience>
    And Ben has answered "Clear to me."
    And Cara has answered "Clear to Cara."
    When Ben looks at what they have given
    Then Ben's Given reads "Clear to me."
    And Cara is shown as having answered, without what they wrote

    Examples:
      | audience    |
      | nobody else |
      | Dan         |

  @api
  Scenario: Another person's answer the reader may read is there
    Given Ann has asked Ben and Cara for Feedback: "How clear was the plan?", shared with everyone in the Workspace
    And Ben has answered "Clear to me."
    And Cara has answered "Clear to Cara."
    When Ben looks at what they have given
    Then Ben's Given reads "Clear to me."
    And Cara is shown as having answered "Clear to Cara."

  @api
  Scenario: Somebody asked who has not answered yet is shown so
    Given Ann has asked Ben and Cara for Feedback: "How clear was the plan?", shared with nobody else
    And Ben has answered "Clear to me."
    When Ben looks at what they have given
    Then Cara is shown as not having answered yet

  @api
  Scenario Outline: What the reader did not write is not there
    Given <written>
    When Ann looks at what they have given
    Then Ann's Given is empty

    Examples:
      | written                                                   |
      | Ben has given Ann Feedback: "To Ann."                     |
      | Ben has given Cara Feedback: "To Cara."                   |
      | Ben has given Kudos: "@Ann carried the launch."           |
      | Ben has given Kudos: "Great launch, everyone."            |
      | Ann has asked Ben for Feedback: "How clear was the plan?" |

  @api
  Scenario: Given reads to its end, across Feedback and Kudos, with nothing repeated
    Given Ann has given Ben Feedback: "One."
    And Ann has given Kudos: "@Ben two."
    And Ann has given Cara Feedback: "Three."
    When Ann reads Given two at a time to the end
    Then Ann has read "Three." then "@Ben two." then "One." with nothing repeated

  @api
  Scenario: Somebody outside a Workspace cannot read what was given in it
    Given Dan owns a Workspace called "Globex"
    And Ann has given Ben Feedback: "Written to Ben."
    When Dan signs in and looks at what was given in Ann's Workspace
    Then Dan is told that Workspace cannot be found
