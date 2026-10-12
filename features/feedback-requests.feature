Feature: Feedback requests
  A Member asks a teammate for Feedback on a Topic. The request is visible to
  the people in it, and to nobody outside the Workspace.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace

  @api
  Scenario: A Member asks a teammate for Feedback
    When Ann asks Ben for Feedback on "Running the planning meeting"
    Then Ann can open the request about "Running the planning meeting"
    And Ben can open the request about "Running the planning meeting"

  @api
  Scenario: Someone outside the Workspace cannot open a Feedback request
    Given Ann has asked Ben for Feedback on "Running the planning meeting"
    And Cara owns a Workspace called "Globex"
    When Cara opens Ann's Feedback request
    Then Cara is told it cannot be found
