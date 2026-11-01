Feature: Kudos
  A Member praises teammates in a line or two by @mentioning them, or the whole Workspace by
  naming nobody. One Kudos goes to every teammate it mentions, and every Member of the Workspace
  can read it. It is the fastest way to give Feedback: nobody is picked from a list and nobody
  chooses who reads it.

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
  Scenario: A Kudos written on a card is read on that card, by the whole Workspace
    Given Dee is a Member of Ann's Workspace
    And Ann has given Kudos on a card: "@Ben carried the launch."
    When Dee looks at the Kudos of their Workspace
    Then Dee sees the card the Kudos was written on

  @api
  Scenario: A Kudos need not be written on a card
    Given Ann has given Kudos: "@Ben carried the launch."
    When Cara looks at the Kudos of their Workspace
    Then Cara sees the Kudos on no card

  @api
  Scenario: A card has to be one the Workspace could have sent
    When Ann gives Kudos on a card with no template it could have: "@Ben carried the launch."
    Then Ann is told the Kudos card cannot be sent

  @api
  Scenario: A Kudos that names nobody is for the whole Workspace
    Given Ann has given Kudos: "Great launch, everyone."
    When Cara looks at the Kudos of their Workspace
    Then Cara reads a Kudos for the whole Workspace

  @api
  Scenario: Somebody from another Workspace cannot be given Kudos
    Given Dan owns a Workspace called "Globex"
    And Ann has given Kudos: "@Dan carried the launch."
    When Cara looks at the Kudos of their Workspace
    Then Cara reads a Kudos for the whole Workspace

  @api
  Scenario: A Kudos is a line or two
    When Ann gives Kudos longer than 280 characters to @Ben
    Then Ann is told the Kudos is too long

  @api
  Scenario: Somebody outside a Workspace cannot read its Kudos
    Given Dan owns a Workspace called "Globex"
    When Dan signs in and looks at the Kudos of Ann's Workspace
    Then Dan is told that Workspace cannot be found

  @api
  Scenario: The Kudos of one month can be read on their own
    Given Ann has given Kudos: "@Ben carried the launch."
    When Cara looks at this month's Kudos of their Workspace
    Then Cara reads 1 Kudos
    When Cara looks at the Kudos of their Workspace from "2020-01"
    Then Cara reads no Kudos

  @api
  Scenario: A Member can see how many Kudos each month holds
    Given Ann has given Kudos: "@Ben carried the launch."
    And Ann has given Kudos: "@Cara kept us calm."
    When Cara counts the Kudos of their Workspace
    Then Cara is told of 2 Kudos in all, every one of them this month

  @api
  Scenario: A Workspace with no Kudos has no months
    When Cara counts the Kudos of their Workspace
    Then Cara is told of 0 Kudos in all, in no month

  @api
  Scenario: A month has to be a month
    When Cara looks at the Kudos of their Workspace from "2026-13"
    Then the request is refused as malformed

  @api
  Scenario: Somebody outside a Workspace cannot count its Kudos
    Given Dan owns a Workspace called "Globex"
    When Dan signs in and counts the Kudos of Ann's Workspace
    Then Dan is told that Workspace cannot be found
