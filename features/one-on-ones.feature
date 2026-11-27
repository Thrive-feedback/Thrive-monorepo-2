Feature: 1:1s
  Two Members of a Workspace meet one to one, on a schedule of days: how often, and on which
  day, with no time of day. Either may invite the other;
  nothing runs until the person invited accepts, and then the two are equal. Each meeting has
  an agenda both prepare, notes both write once it starts, and a summary when either finishes
  it. A 1:1 is only ever read by its two people. An agenda opens with what was not reached last
  time; while it is prepared, either person may use a template for it: one of Thrive's, one the
  Workspace keeps for everyone, or one a Member keeps for themselves, which nobody else sees.

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
  Scenario: A 1:1 is set by its day alone, and meets all that day
    Given Ann has invited Ben to a weekly 1:1
    When Ben accepts the 1:1
    Then Ann sees the 1:1 meets weekly on Thursday, with no time of day
    And Ann's next meeting is on a Thursday, from the start of that day

  @api
  Scenario: A 1:1 held once is met once its meeting is finished, though its day is still to come
    Given Ann and Ben have a 1:1 held once next week
    And Ann has started the next meeting
    When Ben finishes the next meeting
    Then Ann sees the 1:1 has no next meeting

  @api
  Scenario: A meeting whose day passed unstarted is overdue until the next meeting day
    Given today is Thu 3 Dec 2026
    And Ann and Ben have a running weekly 1:1
    And Ann has added "Launch retro" to the next meeting
    When today is Fri 4 Dec 2026
    Then Ann sees the next meeting overdue from Thu 3 Dec 2026, skipped from Thu 10 Dec 2026
    And Ann's next meeting has "Launch retro"

  @api
  Scenario: A meeting started late is the missed day's, and the schedule does not move
    Given today is Thu 3 Dec 2026
    And Ann and Ben have a running weekly 1:1
    And today is Sat 5 Dec 2026
    And Ann has started the next meeting
    When Ben finishes the next meeting
    Then Ann sees the meeting for Thu 3 Dec 2026 held on Sat 5 Dec 2026
    And Ann sees the next meeting on Thu 10 Dec 2026

  @api
  Scenario: A meeting never started is skipped when the next day comes, and its agenda moves on
    Given today is Thu 3 Dec 2026
    And Ann and Ben have a running weekly 1:1
    And Ann has added "Launch retro" to the next meeting
    When today is Thu 17 Dec 2026
    Then Ann sees Thu 3 Dec 2026 and Thu 10 Dec 2026 skipped
    And Ann sees the next meeting on Thu 17 Dec 2026
    And Ann's next meeting has "Launch retro"

  @api
  Scenario: A meeting started before its day is that day's, so there are never two in one round
    Given today is Thu 3 Dec 2026
    And Ann and Ben have a running weekly 1:1
    And Ann has started the next meeting
    And Ben has finished the next meeting
    And today is Sat 5 Dec 2026
    And Ann has started the next meeting
    When Ben finishes the next meeting
    Then Ann sees the meeting for Thu 10 Dec 2026 held on Sat 5 Dec 2026
    And Ann sees the next meeting on Thu 17 Dec 2026

  @api
  Scenario: A meeting held once is overdue for seven days, then skipped and over
    Given today is Thu 3 Dec 2026
    And Ann and Ben have a 1:1 held once on Thu 3 Dec 2026
    When today is Wed 9 Dec 2026
    Then Ann sees the next meeting overdue from Thu 3 Dec 2026, skipped from Thu 10 Dec 2026
    When today is Thu 10 Dec 2026
    Then Ann sees the 1:1 has no next meeting
    And Ann sees Thu 3 Dec 2026 skipped

  @api
  Scenario: Changing the schedule while a meeting is overdue skips that day at once
    Given today is Thu 3 Dec 2026
    And Ann and Ben have a running weekly 1:1
    And Ann has added "Launch retro" to the next meeting
    And today is Fri 4 Dec 2026
    When Ann moves the 1:1 to Mondays
    Then Ann sees Thu 3 Dec 2026 skipped
    And Ann sees the next meeting on Mon 7 Dec 2026
    And Ann's next meeting has "Launch retro"
    And Ann's next meeting carries "Launch retro" from Thu 3 Dec 2026

  @api
  Scenario: An invitation accepted days later counts its meetings from the day it was accepted
    Given today is Thu 3 Dec 2026
    And Ann has invited Ben to a weekly 1:1
    And today is Wed 23 Dec 2026
    When Ben accepts the 1:1
    Then Ann sees nothing skipped
    And Ann sees the next meeting on Thu 24 Dec 2026

  @api
  Scenario: A schedule changed after a meeting held early meets on its new first day
    Given today is Thu 3 Dec 2026
    And Ann and Ben have a running weekly 1:1
    And Ann has started the next meeting
    And Ben has finished the next meeting
    And today is Mon 7 Dec 2026
    And Ann has started the next meeting
    And Ben has finished the next meeting
    When Ann moves the 1:1 to Tuesdays
    Then Ann sees the next meeting on Tue 8 Dec 2026
    And Ann sees nothing skipped

  @api
  Scenario: A schedule is neither changed nor ended while a meeting is in progress
    Given Ann and Ben have a running weekly 1:1
    And Ann has started the next meeting
    When Ann tries to move the 1:1 to Mondays
    Then Ann is told a meeting is in progress
    When Ben tries to end the 1:1
    Then Ben is told a meeting is in progress

  @api
  Scenario: Ending a schedule while a meeting is overdue skips that day
    Given today is Thu 3 Dec 2026
    And Ann and Ben have a running weekly 1:1
    And today is Fri 4 Dec 2026
    When Ann ends the 1:1
    Then Ann sees Thu 3 Dec 2026 skipped

  @api
  Scenario: An invitation to a meeting held once is not accepted once its day has passed
    Given today is Thu 3 Dec 2026
    And Ann has invited Ben to a 1:1 held once on Thu 3 Dec 2026
    And today is Fri 4 Dec 2026
    When Ben accepts the 1:1
    Then Ben is told its day has passed

  @api
  Scenario: Only the topics written for a day that was skipped say they were carried from it
    Given today is Thu 3 Dec 2026
    And Ann and Ben have a running weekly 1:1
    And Ann has added "Launch retro" to the next meeting
    And today is Thu 10 Dec 2026
    When Ann adds "Offsite" to the next meeting
    Then Ann's next meeting carries "Launch retro" from Thu 3 Dec 2026, and not "Offsite"

  @api
  Scenario: A topic written after a meeting held says nothing of an older skipped day when the schedule changes
    Given today is Thu 3 Dec 2026
    And Ann and Ben have a running weekly 1:1
    And today is Thu 10 Dec 2026
    And Ann has started the next meeting
    And Ben has finished the next meeting
    And today is Mon 14 Dec 2026
    And Ann has added "Launch retro" to the next meeting
    And today is Tue 15 Dec 2026
    When Ann moves the 1:1 to Fridays
    Then Ann sees Thu 3 Dec 2026 skipped
    And Ann's next meeting has "Launch retro"
    And Ann's next meeting carries nothing from a skipped day

  @api
  Scenario: A topic written before the first meeting day says it was carried once that day is skipped
    Given today is Mon 30 Nov 2026
    And Ann and Ben have a running weekly 1:1
    And today is Tue 1 Dec 2026
    And Ann has added "Launch retro" to the next meeting
    When today is Thu 10 Dec 2026
    Then Ann's next meeting carries "Launch retro" from Thu 3 Dec 2026

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

  @api
  Scenario: A new meeting opens with nothing from a template
    Given Ann and Ben have a running weekly 1:1
    When Ben adds "Career path" to the next meeting
    Then Ben's next meeting has only "Career path"

  @api
  Scenario: A Member's own template is theirs alone, and is used for a meeting while it is prepared
    Given Ben has kept a template "Sprint retro" asking "What slowed us?"
    And Ben and Cara have a running weekly 1:1
    When Ben uses "Sprint retro" for the next meeting
    Then Cara's next meeting has "What slowed us?"
    And Cara does not see the template "Sprint retro"

  @api
  Scenario: Using another template replaces the first one's questions, and keeps the rest
    Given Ben has kept a template "Sprint retro" asking "What slowed us?"
    And Ben has kept a template "Career chat" asking "Where next?"
    And Ann and Ben have a running weekly 1:1
    And Ben has added "Offsite" to the next meeting
    And Ben has used "Sprint retro" for the next meeting
    When Ben uses "Career chat" for the next meeting
    Then Ben's next meeting has only "Offsite" and "Where next?"

  @api
  Scenario: A template is not used for a meeting that has started
    Given Ben has kept a template "Sprint retro" asking "What slowed us?"
    And Ann and Ben have a running weekly 1:1
    And Ann has started the next meeting
    When Ben uses "Sprint retro" for the next meeting
    Then Ben is told the meeting has already started

  @api
  Scenario: Only an Admin keeps templates for the whole Workspace
    When Ben keeps a template "Team health" for the Workspace
    Then Ben is told the template is not theirs

  @api
  Scenario: The Workspace's templates are everyone's to use, and the Admins' to change
    Given Ann has kept a template "Team health" for the Workspace asking "How is the team?"
    When Ben renames the template "Team health" to "Ours"
    Then Ben is told the template is not theirs
    And Ben sees the template "Team health"

  @api
  Scenario: A removed template is used by nobody
    Given Ben has kept a template "Sprint retro" asking "What slowed us?"
    And Ann and Ben have a running weekly 1:1
    When Ben removes the template "Sprint retro"
    Then Ben does not see the template "Sprint retro"
    And Ben cannot use "Sprint retro" for the next meeting

  @api
  Scenario: A template needs a question
    When Ben keeps a template "Empty" of their own with no question
    Then Ben is told the template cannot be kept

  @api
  Scenario: Two of one's own templates never share a name
    Given Ben has kept a template "Sprint retro" asking "What slowed us?"
    When Ben keeps a template "sprint retro" of their own
    Then Ben is told they keep one by that name already
