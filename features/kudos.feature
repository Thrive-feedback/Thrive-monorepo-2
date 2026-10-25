Feature: Kudos
  A Member praises teammates in a line or two by @mentioning them. One Kudos goes to every
  teammate it mentions, and every Member of the Workspace can read it. It is the fastest way
  to give Feedback: nobody is picked from a list and nobody chooses who reads it.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    And Cara is a Member of Ann's Workspace
    And Ben has introduced themselves
    And Cara has introduced themselves

  @api
  Scenario: One Kudos reaches every teammate it mentions, and the whole Workspace reads it
    Given Dee is a Member of Ann's Workspace
    And Ann has given Kudos: "@Ben and @Cara carried the launch."
    When Dee looks at the Kudos of their Workspace
    Then Dee reads Kudos "@Ben and @Cara carried the launch." from Ann to Ben and Cara

  @api
  Scenario: A Kudos that mentions nobody in the Workspace is for nobody
    Given Dan owns a Workspace called "Globex"
    When Ann gives Kudos: "@Dan carried the launch."
    Then Ann is told a Kudos has to mention a teammate

  @api
  Scenario: A Kudos is a line or two
    When Ann gives Kudos longer than 280 characters to @Ben
    Then Ann is told the Kudos is too long

  @api
  Scenario: Somebody outside a Workspace cannot read its Kudos
    Given Dan owns a Workspace called "Globex"
    When Dan signs in and looks at the Kudos of Ann's Workspace
    Then Dan is told that Workspace cannot be found
