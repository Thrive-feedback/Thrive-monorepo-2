Feature: Being messaged in a chat tool about Feedback
  Somebody who has linked their own chat account is messaged there when a teammate
  asks them for Feedback. A direct message has one reader, and that reader is a party
  to the thing, so it may name who asked and what about — unlike a shared channel.
  Nobody who has not linked an account is messaged, nobody is told about their own
  action, and asking for Feedback never fails because a chat tool is unreachable.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace

  @api
  Scenario: Somebody who linked their account is messaged when they are asked
    Given Ben has linked his Discord account as "ben#0001"
    When Ann asks Ben for Feedback: "Running the planning meeting"
    Then Ben is messaged in Discord about "Running the planning meeting"
    And the message names "Acme"
    And the message links to the Ask

  @api
  Scenario: Somebody who linked nothing is not messaged, and the request still works
    When Ann asks Ben for Feedback: "Running the planning meeting"
    Then nobody is messaged in Discord
    And Ben can open the request saying "Running the planning meeting"

  @api
  Scenario: Nobody is messaged about their own action
    Given Ann has linked her Discord account as "ann#0001"
    When Ann asks Ben for Feedback: "Running the planning meeting"
    Then nobody is messaged in Discord

  @api
  Scenario: Asking succeeds even when the chat tool will not deliver
    Given Ben has linked his Discord account as "ben#0001"
    And Discord will not let Thrive message anybody
    When Ann asks Ben for Feedback: "Running the planning meeting"
    Then nobody is messaged in Discord
    And Ben can open the request saying "Running the planning meeting"

  @api
  Scenario: A Member who unlinked is no longer messaged
    Given Ben has linked his Discord account as "ben#0001"
    And Ben has unlinked Discord
    When Ann asks Ben for Feedback: "Running the planning meeting"
    Then nobody is messaged in Discord

  @api
  Scenario: The Member who asked is messaged when their request is answered
    Given Ann has linked her Discord account as "ann#0001"
    And Ann has asked Ben for Feedback: "Running the planning meeting"
    And the messages sent so far are set aside
    When Ben answers "You open strongly and lose the room at the detail."
    Then Ann is messaged in Discord about "answered your feedback request"
    And the message names "Acme"
    And the message links to the request
    And no message carries "lose the room"

  @api
  Scenario: Nobody but the Member who asked is told an Ask was answered
    Given Cara is a Member of Ann's Workspace
    And Cara has linked her Discord account as "cara#0001"
    And Ann has asked Ben for Feedback: "Running the planning meeting"
    And Ann has asked Cara for Feedback: "Running the planning meeting"
    And the messages sent so far are set aside
    When Ben answers "You open strongly and lose the room at the detail."
    Then nobody is messaged in Discord

  @api
  Scenario: Answering succeeds when the Requester linked nothing
    Given Ann has asked Ben for Feedback: "Running the planning meeting"
    When Ben answers "You open strongly and lose the room at the detail."
    Then nobody is messaged in Discord
    And Ann reads "You open strongly and lose the room at the detail." on the request saying "Running the planning meeting"

  @api
  Scenario: Somebody is messaged when Feedback is written to them unasked
    Given Ben has linked his Discord account as "ben#0001"
    When Ann gives Ben Feedback: "You kept the room with you."
    Then Ben is messaged in Discord about "wrote feedback to you"
    And the message links to the Feedback
    And no message carries "kept the room"

  @api
  Scenario: Somebody chosen to see it is told it was shared with them
    Given Cara is a Member of Ann's Workspace
    And Cara has linked her Discord account as "cara#0001"
    When Ann gives Ben Feedback: "You kept the room with you.", shared with Cara
    Then Cara is messaged in Discord about "shared feedback with you"

  @api
  Scenario: Answering an Ask sends the answered message, never this one
    Given Ann has linked her Discord account as "ann#0001"
    And Ann has asked Ben for Feedback: "Running the planning meeting"
    And the messages sent so far are set aside
    When Ben answers "You open strongly and lose the room at the detail."
    Then Ann is messaged in Discord about "answered your feedback request"
    And no message carries "wrote feedback to you"

  @api
  Scenario: Giving Feedback succeeds when the Receiver linked nothing
    When Ann gives Ben Feedback: "You kept the room with you."
    Then nobody is messaged in Discord
    And Ben looks at the Feedback written to them
    And Ben reads "You kept the room with you." from Ann, given without being asked
