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

  @api
  Scenario: A teammate answers what they were asked, and the Member who asked reads it
    Given Ann has asked Ben for Feedback on "Running the planning meeting"
    When Ben answers "You open strongly and lose the room at the detail."
    Then Ann reads "You open strongly and lose the room at the detail." on the request about "Running the planning meeting"

  @api
  Scenario: An answered Ask stops waiting
    Given Ann has asked Ben for Feedback on "Running the planning meeting"
    And Ben has answered "You open strongly and lose the room at the detail."
    When Ben looks at what they have been asked
    Then Ben has nothing waiting for them

  @api
  Scenario: An Ask collects one answer, and the first one is final
    Given Ann has asked Ben for Feedback on "Running the planning meeting"
    And Ben has answered "You open strongly and lose the room at the detail."
    When Ben answers "And another thing."
    Then Ben is told the Ask has already been answered

  @api
  Scenario: An Ask is answered by the Member it waits on and by nobody else
    Given Cara is a Member of Ann's Workspace
    And Ann has asked Ben for Feedback on "Running the planning meeting"
    When Cara answers the Ask waiting for Ben
    Then Cara is told the Ask cannot be found

  @api
  Scenario: A Member reads the Feedback written to them
    Given Ann has asked Ben for Feedback on "Running the planning meeting"
    And Ben has answered "You open strongly and lose the room at the detail."
    When Ann looks at the Feedback written to them
    Then Ann reads "You open strongly and lose the room at the detail." from Ben about "Running the planning meeting"

  @api
  Scenario: Feedback written to one Member is not another Member's to read
    Given Cara is a Member of Ann's Workspace
    And Ann has asked Ben for Feedback on "Running the planning meeting"
    And Ben has answered "You open strongly and lose the room at the detail."
    When Cara looks at the Feedback written to them
    Then Cara has no Feedback written to them
