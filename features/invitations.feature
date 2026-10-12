Feature: Invitations
  An Owner brings teammates into their Workspace by email. Each teammate
  joins from the link in their Invitation.

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
