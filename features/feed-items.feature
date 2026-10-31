Feature: Home
  A Member reads, in one list, what was shown to everyone in their Workspace and what somebody
  selected or mentioned them to read. What was written to them alone, and what they keep to a
  few people themselves, is in their own history, not here.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    And Cara is a Member of Ann's Workspace

  @api
  Scenario: All Feedback holds what was shown to everyone and what selects the reader
    Given Ben has given Cara Feedback: "To everyone.", shared with everyone in the Workspace
    And Ben has given Cara Feedback: "Selects Ann.", shared with Ann
    When Ann looks at All Feedback on Home
    Then Ann's Home reads "Selects Ann." then "To everyone."

  @api
  Scenario: Everyone in the Workspace leaves out what selects the reader
    Given Ben has given Cara Feedback: "To everyone.", shared with everyone in the Workspace
    And Ben has given Cara Feedback: "Selects Ann.", shared with Ann
    When Ann looks at Everyone in the Workspace on Home
    Then Ann's Home reads "To everyone."

  @api
  Scenario: Shared with me leaves out what was shown to everyone
    Given Ben has given Cara Feedback: "To everyone.", shared with everyone in the Workspace
    And Ben has given Cara Feedback: "Selects Ann.", shared with Ann
    When Ann looks at Shared with me on Home
    Then Ann's Home reads "Selects Ann."

  @api
  Scenario: Being mentioned in Feedback kept to a few people puts it on Home
    Given Ben has given Cara Feedback: "You and @Ann kept the room with you.", shared with Ann
    When Ann looks at Shared with me on Home
    Then Ann reads it mentioning Ann

  @api
  Scenario: Feedback written to the reader for everyone to see is on Home
    Given Ben has given Ann Feedback: "To Ann, for everyone.", shared with everyone in the Workspace
    When Ann looks at All Feedback on Home
    Then Ann's Home reads "To Ann, for everyone."

  @api
  Scenario: Feedback the reader gave for everyone to see is on Home
    Given Ann has given Ben Feedback: "From Ann, for everyone.", shared with everyone in the Workspace
    When Ann looks at All Feedback on Home
    Then Ann's Home reads "From Ann, for everyone."

  @api
  Scenario Outline: What belongs to the reader's own history is not on Home
    Given Dan is a Member of Ann's Workspace
    And <giver> has given <receiver> Feedback: "Not on Home.", shared with <audience>
    When Ann looks at All Feedback on Home
    Then Ann's Home is empty

    Examples:
      | giver | receiver | audience    |
      | Ben   | Ann      | Dan         |
      | Ann   | Ben      | Dan         |
      | Ben   | Ann      | nobody else |

  @api
  Scenario: An answer on Home says what was asked and who asked it
    Given Cara has asked Ben for Feedback: "How clear was the plan?", shared with Ann
    And Ben has answered "The order of the steps was clear."
    When Ann looks at Shared with me on Home
    Then Ann's Home reads "The order of the steps was clear."
    And it answers "How clear was the plan?", asked by Cara

  @api
  Scenario: An answer shown to everyone says where everyone asked stands and what they answered
    Given Dan is a Member of Ann's Workspace
    And Cara has asked Ben and Dan for Feedback: "How clear was the plan?", shared with everyone in the Workspace
    And Ben has answered "The order of the steps was clear."
    When Ann looks at All Feedback on Home
    Then Ben is shown as having answered "The order of the steps was clear."
    And Dan is shown as not having answered yet

  @api
  Scenario: Somebody selected reads everyone asked as everyone in the Workspace would
    Given Dan is a Member of Ann's Workspace
    And Cara has asked Ben and Dan for Feedback: "How clear was the plan?", shared with Ann
    And Ben has answered "The order of the steps was clear."
    When Ann looks at Shared with me on Home
    Then Ben is shown as having answered "The order of the steps was clear."
    And Dan is shown as not having answered yet

  @api
  Scenario: Somebody asked who was not selected does not read the others' answers on Home
    Given Dan is a Member of Ann's Workspace
    And Cara has asked Ben and Dan for Feedback: "How clear was the plan?", shared with Ann
    And Ben has answered "The order of the steps was clear."
    When Dan looks at All Feedback on Home
    Then Dan's Home is empty

  @api
  Scenario: Somebody asked and selected reads the others' answers before writing their own
    Given Dan is a Member of Ann's Workspace
    And Cara has asked Ben and Dan for Feedback: "How clear was the plan?", shared with Dan
    And Ben has answered "The order of the steps was clear."
    When Dan looks at All Feedback on Home
    Then Ben is shown as having answered "The order of the steps was clear."
    And Dan is shown as not having answered yet

  @api
  Scenario: Answers kept to the person who asked are not on Home
    Given Dan is a Member of Ann's Workspace
    And Cara has asked Ben and Dan for Feedback: "How clear was the plan?"
    And Ben has answered "The order of the steps was clear."
    When Dan looks at All Feedback on Home
    Then Dan's Home is empty

  @api
  Scenario: Home says who is reading it and who can read each piece
    Given Ben has given Cara Feedback: "To everyone.", shared with everyone in the Workspace
    And Ben has given Cara Feedback: "Selects Ann.", shared with Ann
    When Ann looks at All Feedback on Home
    Then Ann's Home is told it is being read by Ann
    And "To everyone." can be read by everyone in the Workspace
    And "Selects Ann." can be read by the people selected

  @api
  Scenario: Home pages through everything with one cursor
    Given Ben has given Cara Feedback: "First.", shared with everyone in the Workspace
    And Ben has given Cara Feedback: "Second.", shared with Ann
    And Ben has given Cara Feedback: "Third.", shared with everyone in the Workspace
    When Ann reads Home two at a time to the end
    Then Ann has read "Third." then "Second." then "First." with nothing repeated

  @api
  Scenario: A Member of another Workspace reads none of this Home
    Given Ben has given Cara Feedback: "To everyone.", shared with everyone in the Workspace
    When Dana signs in and looks at Home in Ann's Workspace
    Then Dana is told that Workspace does not exist

  @api
  Scenario: Home refuses a choice it does not offer
    When Ann looks at Home showing "MINE"
    Then Home refuses the choice
