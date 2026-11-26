Feature: 1:1s
  Two Members of a Workspace meet one to one, on a schedule. Either may invite the other;
  nothing runs until the person invited accepts, and then the two are equal. Each meeting has
  an agenda both prepare, notes both write once it starts, and a summary when either finishes
  it. A 1:1 is only ever read by its two people.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    And Cara is a Member of Ann's Workspace

  @api
  Scenario: The person invited accepts, and the 1:1 runs for both
    Given Ann has invited Ben to a weekly 1:1
    When Ben accepts the 1:1
    Then Ann sees the 1:1 with Ben running
    And Ben sees the 1:1 with Ann running

  @api
  Scenario: Nobody else reads a 1:1
    Given Ann has invited Ben to a weekly 1:1
    When Cara opens Ann's 1:1 with Ben
    Then Cara is told there is no such 1:1

  @api
  Scenario: Whoever sent an invitation cannot accept it
    Given Ann has invited Ben to a weekly 1:1
    When Ann accepts the 1:1
    Then Ann is told it is not theirs to answer

  @api
  Scenario: Two people keep one 1:1 at a time
    Given Ann has invited Ben to a weekly 1:1
    When Ben invites Ann to a weekly 1:1
    Then Ben is told they already have one

  @api
  Scenario: A topic a person added is theirs alone to remove
    Given Ann and Ben have a running weekly 1:1
    And Ben has added "Career path" to the next meeting
    When Ann removes "Career path" from the next meeting
    Then Ann is told the topic is not theirs

  @api
  Scenario: Notes wait for the meeting to start
    Given Ann and Ben have a running weekly 1:1
    And Ben has added "Career path" to the next meeting
    When Ann writes "Too early" on "Career path"
    Then Ann is told the meeting has not started

  @api
  Scenario: A note the other person changed is not overwritten
    Given Ann and Ben have a running weekly 1:1
    And Ben has added "Career path" to the next meeting
    And Ann has started the next meeting
    And Ben has written "Wants to lead" on "Career path"
    When Ann writes "Ann's take" on "Career path" from before Ben wrote
    Then Ann is told the topic changed

  @api
  Scenario: A finished meeting is shared with both, and what was not reached carries over
    Given Ann and Ben have a running weekly 1:1
    And Ben has added "Career path" to the next meeting
    And Ann has started the next meeting
    When Ben finishes the next meeting
    Then Ann sees one past meeting with "Career path"
    And Ann's next meeting opens with "Career path" carried over

  @api
  Scenario: Nothing more is written to the meetings of a 1:1 that has ended
    Given Ann and Ben have a running weekly 1:1
    And Ben has ended the 1:1
    When Ann adds "Too late" to the next meeting
    Then Ann is told the 1:1 is not running
