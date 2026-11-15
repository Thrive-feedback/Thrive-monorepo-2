Feature: Profiles
  A person introduces themselves once, by their full name and the name their
  team calls them, and Thrive knows them by it from then on. Inside a Workspace,
  every Member can open anyone's Profile: who they are, where they stand there,
  what was written to them that the whole Workspace reads, and what was written
  to them that somebody chose to show the reader.

  @api
  Scenario: A person introduces themselves
    Given Ann is signed in
    When Ann introduces themselves
    Then Ann is known as "Ann", with the full name "Ann Lee"

  @api
  Scenario: A person introduces themselves only once
    Given Ann is signed in
    And Ann has introduced themselves
    When Ann introduces themselves
    Then Ann is told they have already introduced themselves

  @api
  Scenario: A Member opens a teammate's Profile
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    And Ben has introduced themselves
    When Ben opens Ann's Profile
    Then the Profile names Ann "Ann", with the full name "Ann Lee", as an Admin

  @api
  Scenario Outline: A Profile shows only the Feedback everyone in the Workspace reads
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    And Cara is a Member of Ann's Workspace
    And Ben has introduced themselves
    And Cara has introduced themselves
    And Ben has given Ann Feedback: "Written to Ann.", shared with <audience>
    When <reader> reads the Feedback on Ann's Profile
    Then the Profile reads <read>

    Examples:
      | audience                  | reader | read              |
      | everyone in the Workspace | Cara   | "Written to Ann." |
      | everyone in the Workspace | Ann    | "Written to Ann." |
      | Cara                      | Cara   | nothing           |
      | nobody else               | Ann    | nothing           |

  @api
  Scenario Outline: A Profile shows its reader the Feedback somebody chose to show them, apart
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    And Cara is a Member of Ann's Workspace
    And Dan is a Member of Ann's Workspace
    And Ben has introduced themselves
    And Cara has introduced themselves
    And Dan has introduced themselves
    And Ben has given Ann Feedback: "Written to Ann.", shared with Cara
    When <reader> reads the Feedback shared with them on Ann's Profile
    Then the Profile reads <read>

    Examples:
      | reader | read              |
      | Cara   | "Written to Ann." |
      | Dan    | nothing           |
      | Ann    | nothing           |

  @api
  Scenario: An answer to the person's request shared with the reader is shown to them
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    And Cara is a Member of Ann's Workspace
    And Ben has introduced themselves
    And Cara has introduced themselves
    And Ann has asked Ben for Feedback: "How clear was the plan?", shared with Cara
    And Ben has answered "The order of the steps was clear."
    When Cara reads the Feedback shared with them on Ann's Profile
    Then the Profile reads "The order of the steps was clear."

  @api
  Scenario: Feedback shared with the reader stays on the Profile of someone who has left
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    And Cara is a Member of Ann's Workspace
    And Ben has introduced themselves
    And Cara has introduced themselves
    And Ann has given Ben Feedback: "Written to Ben.", shared with Cara
    And Ann has Deactivated Ben
    When Cara reads the Feedback shared with them on Ben's Profile
    Then the Profile reads "Written to Ben."

  @api
  Scenario: A Profile shows an answer to the person's request when everyone reads it
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    And Cara is a Member of Ann's Workspace
    And Ben has introduced themselves
    And Cara has introduced themselves
    And Ann has asked Ben for Feedback: "How clear was the plan?", shared with everyone in the Workspace
    And Ben has answered "The order of the steps was clear."
    And Ben has given Ann Feedback: "The demo landed well.", shared with everyone in the Workspace
    When Cara reads the Feedback on Ann's Profile
    Then the Profile reads "The demo landed well." then "The order of the steps was clear."

  @api
  Scenario: A Profile shows only the Kudos that name the person
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    And Cara is a Member of Ann's Workspace
    And Ben has introduced themselves
    And Cara has introduced themselves
    And Cara has given Kudos: "@Ann carried the launch."
    And Cara has given Kudos: "@Ben fixed the build."
    And Cara has given Kudos: "Great week, everyone."
    When Ben reads the Kudos on Ann's Profile
    Then the Profile reads "@Ann carried the launch."

  @api
  Scenario: A Deactivated Member's Profile can still be opened
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    And Cara is a Member of Ann's Workspace
    And Ben has introduced themselves
    And Cara has introduced themselves
    And Ann has Deactivated Ben
    When Cara opens Ben's Profile
    Then the Profile shows Ben as Deactivated

  @api
  Scenario: Someone who was never in the Workspace has no Profile there
    Given Ann owns a Workspace called "Acme"
    And Dan owns a Workspace called "Globex"
    When Ann opens Dan's Profile
    Then Ann is told there is no such Profile
