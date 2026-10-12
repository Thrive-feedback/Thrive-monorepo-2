Feature: Workspace
  A founder introduces themselves and creates the Workspace their team will use,
  becoming its Owner. A person belongs to one Workspace.

  @api
  Scenario: A founder creates a Workspace and becomes its Owner
    Given Ann is signed in
    And Ann has introduced themselves
    When Ann creates a Workspace called "Acme"
    Then Ann is the Owner of "Acme"

  @api
  Scenario: Someone who has not introduced themselves cannot create a Workspace
    Given Ann is signed in
    When Ann creates a Workspace called "Acme"
    Then Ann is told to introduce themselves first

  @api
  Scenario: Someone already in a Workspace cannot create another
    Given Ann owns a Workspace called "Acme"
    When Ann creates a Workspace called "Globex"
    Then Ann is told they already belong to a Workspace
