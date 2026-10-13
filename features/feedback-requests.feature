Feature: Feedback requests
  A Member asks a teammate for Feedback on a Topic. The request is read by the
  person who sent it and the people it asks, and by nobody else.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace

  @api
  Scenario: A Member asks a teammate for Feedback
    When Ann asks Ben for Feedback on "Running the planning meeting"
    Then Ann can open the request about "Running the planning meeting"
    And Ben can open the request about "Running the planning meeting"

  @api
  Scenario: A Member sees the requests they have sent
    Given Ann has asked Ben for Feedback on "Running the planning meeting"
    When Ann looks at the requests they have sent
    Then Ann sees a request about "Running the planning meeting" asking Ben

  @api
  Scenario: A teammate sees what they have been asked
    Given Ann has asked Ben for Feedback on "Running the planning meeting"
    When Ben looks at what they have been asked
    Then Ben sees an Ask from Ann about "Running the planning meeting" waiting for an answer
    And Ben can open the Ask about "Running the planning meeting"

  @api
  Scenario Outline: Someone who is not part of a Feedback request cannot open it
    Given Ann has asked Ben for Feedback on "Running the planning meeting"
    And Cara <relationship>
    When Cara opens Ann's Feedback request
    Then Cara is told it cannot be found

    Examples:
      | relationship                     |
      | is a Member of Ann's Workspace   |
      | owns a Workspace called "Globex" |

  @api
  Scenario: The requests a Member has sent are only their own
    Given Cara is a Member of Ann's Workspace
    And Ann has asked Ben for Feedback on "Running the planning meeting"
    And Ben has asked Cara for Feedback on "Reviewing pull requests"
    When Ann looks at the requests they have sent
    Then Ann sees a request about "Running the planning meeting" asking Ben

  @api
  Scenario: A Member who has not been asked has nothing waiting
    Given Cara is a Member of Ann's Workspace
    And Ann has asked Ben for Feedback on "Running the planning meeting"
    When Cara looks at what they have been asked
    Then Cara has nothing waiting for them

  @api
  Scenario Outline: An Ask is opened by the Member waiting to answer it and by nobody else
    Given Cara is a Member of Ann's Workspace
    And Ann has asked Cara for Feedback on "Reviewing pull requests"
    When <opener> opens the Ask waiting for Cara
    Then <opener> is told the Ask cannot be found

    Examples:
      | opener | who they are           |
      | Ben    | another Member         |
      | Ann    | the Requester who sent it |
