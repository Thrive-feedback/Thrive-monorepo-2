Feature: Linking my own chat account
  A Member links their own Discord account to Thrive, from their own Settings,
  so that Thrive can message them directly. Linking is the switch: there are no
  preferences, and unlinking is how somebody stops being messaged. Nobody can
  link an account for anybody else, and nobody sees anybody else's link.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace

  @api
  Scenario: A Member links their own Discord account and sees which one it is
    When Ann links her Discord account as "ann#0001"
    Then Ann sees "ann#0001" linked for Discord

  @api
  Scenario: Nobody has linked anything to begin with
    When Ann looks at her linked accounts
    Then Ann has no linked accounts

  @api
  Scenario: Unlinking forgets the account, and offers linking again
    Given Ann has linked her Discord account as "ann#0001"
    When Ann unlinks Discord
    Then Ann has no linked accounts

  @api
  Scenario: Unlinking what was never linked says so
    When Ann unlinks Discord
    Then Ann is told she has not linked that chat tool

  @api
  Scenario: A Member sees their own link and never anybody else's
    Given Ann has linked her Discord account as "ann#0001"
    When Ben looks at his linked accounts
    Then Ben has no linked accounts

  @api
  Scenario: One Discord account cannot be linked by two Members
    Given Ann has linked her Discord account as "shared#0001"
    When Ben links his Discord account as "shared#0001"
    Then Ben is told that chat account is already linked

  @api
  Scenario: Linking again replaces what was there, because a Member has one per tool
    Given Ann has linked her Discord account as "ann#0001"
    When Ann links her Discord account as "ann#0002"
    Then Ann sees "ann#0002" linked for Discord

  @api
  Scenario: A return Thrive did not start is refused
    When Ann comes back from Discord with a state Thrive never signed
    Then Ann is told the link did not start here

  @api
  Scenario: A return carrying somebody else's state is refused
    When Ann comes back from Discord with the state Ben started
    Then Ann is told the link did not start here

  @api
  Scenario: A chat tool Thrive does not link is refused by name
    When Ann begins linking an account in "TEAMS"
    Then Ann is told Thrive does not use that chat tool
