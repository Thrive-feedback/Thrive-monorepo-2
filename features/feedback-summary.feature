Feature: Your feedback summary
  A Member reads what the Feedback written to them adds up to: the themes running through it, what
  people keep praising, what people keep asking for, and a few things to try. It is written by a
  model from their own Feedback and Kudos, every point says which message it came from, and nobody
  else can read it.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    And Cara is a Member of Ann's Workspace
    And Ben has introduced themselves
    And Cara has introduced themselves

  @api
  Scenario: A Member reads the summary of the Feedback written to them
    Given Ann has given Ben Feedback: "The plan was clear."
    And Cara has given Ben Feedback: "You explain tricky things well."
    And Ann has given Ben Feedback: "The estimates slipped twice."
    And the model will answer that Ben "explains things clearly"
    When Ben's summary is written
    And Ben reads their summary
    Then Ben's summary says "explains things clearly"
    And Ben's summary says it was written from 3 messages
    And Ben's summary is current

  @api
  Scenario: Every point says which message it came from
    Given Ann has given Ben Feedback: "The plan was clear."
    And Cara has given Ben Feedback: "You explain tricky things well."
    And Ann has given Ben Feedback: "The estimates slipped twice."
    And the model will answer that Ben "explains things clearly"
    When Ben's summary is written
    And Ben reads their summary
    Then every point in the summary names the message it came from

  @api
  Scenario: Nothing is written while too little has been said
    Given Ann has given Ben Feedback: "The plan was clear."
    And Cara has given Ben Feedback: "You explain tricky things well."
    When Ben's summary is written
    And Ben reads their summary
    Then Ben has no summary yet
    And the model was never asked

  @api
  Scenario: A summary says so when newer Feedback has arrived since it was written
    Given Ann has given Ben Feedback: "The plan was clear."
    And Cara has given Ben Feedback: "You explain tricky things well."
    And Ann has given Ben Feedback: "The estimates slipped twice."
    And the model will answer that Ben "explains things clearly"
    And Ben's summary has been written
    When Cara has given Ben Feedback: "The handover notes were thorough."
    And Ben reads their summary
    Then Ben's summary is behind

  @api
  Scenario: A summary is nobody else's to read
    Given Ann has given Ben Feedback: "The plan was clear."
    And Cara has given Ben Feedback: "You explain tricky things well."
    And Ann has given Ben Feedback: "The estimates slipped twice."
    And the model will answer that Ben "explains things clearly"
    And Ben's summary has been written
    When Ann reads their summary
    Then Ann has no summary yet

  @api
  Scenario: A summary is never written from another Workspace's Feedback
    Given Ann has given Ben Feedback: "The plan was clear."
    And Cara has given Ben Feedback: "You explain tricky things well."
    And Ann has given Ben Feedback: "The estimates slipped twice."
    And Dan owns a Workspace called "Globex"
    When Ben's summary is written
    Then the model was given 3 messages

  @api
  Scenario: Nobody is left waiting on a model
    Given Ann has given Ben Feedback: "The plan was clear."
    And Cara has given Ben Feedback: "You explain tricky things well."
    When Ann gives Ben Feedback: "The estimates slipped twice."
    Then the model was never asked
