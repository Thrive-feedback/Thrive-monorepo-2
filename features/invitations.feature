Feature: Invitations
  An Owner brings teammates into their Workspace by email. Each teammate
  joins from the link in their Invitation, or finds it waiting when they
  sign in without the link.

  Background:
    Given Ann owns a Workspace called "Acme"

  @api
  Scenario: An Owner invites a teammate
    Given Ben is signed in
    When Ann invites Ben
    Then Ben is emailed an Invitation to "Acme"
    And Ann sees Ben's Invitation waiting to be accepted

  @api
  Scenario: A teammate joins from their Invitation
    Given Ben is signed in
    And Ann has invited Ben
    When Ben accepts the Invitation
    Then Ben is a Member of "Acme"

  @api
  Scenario: A Member cannot invite
    Given Ben is a Member of Ann's Workspace
    And Cara is signed in
    When Ben invites Cara
    Then Ben is told they may not invite people

  @api
  Scenario: A revoked Invitation cannot be accepted
    Given Ben is signed in
    And Ann has invited Ben
    And Ann has revoked Ben's Invitation
    When Ben accepts the Invitation
    Then Ben is told the Invitation was revoked

  @api
  Scenario: An Invitation can only be accepted by the person it was sent to
    Given Ben is signed in
    And Cara is signed in
    And Ann has invited Ben
    When Cara accepts Ben's Invitation
    Then Cara is told the Invitation is not for them

  @api
  Scenario: Someone who signs in without the link finds every Invitation waiting for them
    Given Dan owns a Workspace called "Globex"
    And Ben is signed in
    And Ann has invited Ben
    And Dan has invited Ben
    When Ben looks for Invitations waiting for them
    Then Ben is offered these Workspaces, newest first:
      | Workspace | Members |
      | Globex    | 1       |
      | Acme      | 1       |

  @api
  Scenario: Someone joins one of the Workspaces waiting for them
    Given Dan owns a Workspace called "Globex"
    And Ben is signed in
    And Ann has invited Ben
    And Dan has invited Ben
    When Ben joins "Acme" from the Invitations waiting for them
    Then Ben is a Member of "Acme"

  @api
  Scenario: Creating a Workspace instead leaves the Invitations waiting
    Given Ben is signed in
    And Ben has introduced themselves
    And Ann has invited Ben
    When Ben creates a Workspace called "Initech"
    Then Ann sees Ben's Invitation waiting to be accepted

  @api
  Scenario: Nobody is offered an Invitation sent to someone else
    Given Ben is signed in
    And Cara is signed in
    And Ann has invited Ben
    When Cara looks for Invitations waiting for them
    Then Cara is offered no Workspaces

  @api
  Scenario: An Owner sees who sent each Invitation
    Given Ben is signed in
    When Ann invites Ben
    Then Ann sees Ben's Invitation was sent by Ann

  @api
  Scenario: An Owner resends an Invitation sent a while ago
    Given Ben is signed in
    And Ann invited Ben an hour ago
    When Ann resends Ben's Invitation
    Then Ben is emailed an Invitation to "Acme"
    And Ann sees Ben's Invitation is good for another 7 days

  @api
  Scenario: Resending an expired Invitation sends a fresh one
    Given Ben is signed in
    And Ann's Invitation to Ben has expired
    When Ann resends Ben's Invitation
    Then Ben is emailed an Invitation to "Acme"
    And Ann sees Ben's Invitation waiting to be accepted

  @api
  Scenario: An Invitation cannot be resent moments after it was sent
    Given Ben is signed in
    And Ann has invited Ben
    When Ann resends Ben's Invitation
    Then Ann is told to wait before sending it again

  @api
  Scenario: A Member cannot resend an Invitation
    Given Ben is a Member of Ann's Workspace
    And Cara is signed in
    And Ann invited Cara an hour ago
    When Ben resends Cara's Invitation
    Then Ben is told they may not resend Invitations
