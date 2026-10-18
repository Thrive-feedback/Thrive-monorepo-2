Feature: Deactivating Members, leaving, and Reactivating
  Deactivating ends someone's access to a Workspace and keeps everything they
  gave and received there, with their name shown as inactive. Anyone can
  Deactivate themselves, which is how they leave; an Admin can also Deactivate
  anyone else, other Admins included. A Workspace always keeps an active Admin.
  An Admin can Reactivate someone, who comes back with the Role they had; or
  the Workspace invites them again, and accepting brings them back as themselves.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace

  @api
  Scenario: An Admin Deactivates a Member, who can no longer open the Workspace
    When Ann Deactivates Ben
    And Ben looks at who is in Ann's Workspace
    Then Ben is told that Workspace cannot be found

  @api
  Scenario: Deactivated people are listed apart from active ones
    Given Ann has Deactivated Ben
    When Ann looks at who is in Ann's Workspace
    Then Ann sees these Members, earliest first:
      | Member | Role  |
      | Ann    | ADMIN |
    When Ann looks at who was Deactivated in Ann's Workspace
    Then Ann sees these Members, earliest first:
      | Member | Role   |
      | Ben    | MEMBER |

  @api
  Scenario: A Deactivated person cannot be asked for Feedback
    Given Ann has Deactivated Ben
    When Ann asks Ben for Feedback on "the launch"
    Then Ann is told Ben is not in their Workspace

  @api
  Scenario: An Admin Deactivates another Admin, the founder included
    Given Ann has made Ben an Admin
    When Ben Deactivates Ann
    And Ann looks at who is in Ann's Workspace
    Then Ann is told that Workspace cannot be found

  @api
  Scenario: A Member cannot Deactivate anyone else
    When Ben Deactivates Ann
    Then Ben is told they may not Deactivate anyone else

  @api
  Scenario: A Member leaves their Workspace
    When Ben leaves their Workspace
    Then Ben is in no Workspace

  @api
  Scenario: The only Admin cannot leave
    When Ann leaves their Workspace
    Then Ann is told to make someone else an Admin first

  @api
  Scenario: Feedback from someone Deactivated stays, showing them as inactive
    Given Ben has given Ann Feedback on "The customer demo": "You kept the room with you.", shared with everyone in the Workspace
    And Ann has Deactivated Ben
    When Ann looks at the Workspace feed
    Then Ann reads "You kept the room with you." from Ben to Ann about "The customer demo" on the feed
    And Ann sees Ben as inactive on the feed

  @api
  Scenario: An Admin Reactivates a former Admin, who can open the Workspace again as an Admin
    Given Ann has made Ben an Admin
    And Ann has Deactivated Ben
    When Ann Reactivates Ben
    And Ben looks at who is in Ann's Workspace
    Then Ben sees these Members, earliest first:
      | Member | Role  |
      | Ann    | ADMIN |
      | Ben    | ADMIN |

  @api
  Scenario: Someone Reactivated is shown as active again
    Given Ben has given Ann Feedback on "The customer demo": "You kept the room with you.", shared with everyone in the Workspace
    And Ann has Deactivated Ben
    When Ann Reactivates Ben
    And Ann looks at the Workspace feed
    Then Ann sees Ben as active on the feed

  @api
  Scenario: A Member cannot Reactivate anyone
    Given Cara is a Member of Ann's Workspace
    And Ann has Deactivated Cara
    When Ben Reactivates Cara
    Then Ben is told they may not Reactivate anyone

  @api
  Scenario: Someone who joined another Workspace meanwhile is Reactivated and keeps both
    Given Ann has Deactivated Ben
    And Dan owns a Workspace called "Globex"
    And Ben is a Member of Dan's Workspace
    When Ann Reactivates Ben
    Then Ben belongs to "Acme" and "Globex"

  @api
  Scenario: Someone Deactivated comes back by accepting a new Invitation, with its Role
    Given Ann has Deactivated Ben
    And Ann has invited Ben as an Admin
    When Ben accepts the Invitation
    Then Ben is an Admin of "Acme"

  @api
  Scenario: Someone who comes back by Invitation reads the Feedback they were given before
    Given Ann has given Ben Feedback on "The customer demo": "You kept the room with you.", shared with everyone in the Workspace
    And Ann has Deactivated Ben
    And Ann has invited Ben
    When Ben accepts the Invitation
    And Ben looks at the Workspace feed
    Then Ben reads "You kept the room with you." from Ann to Ben about "The customer demo" on the feed

  @api
  Scenario: An Invitation is no longer offered once its Workspace has taken the person back
    Given Ann has Deactivated Ben
    And Ann has invited Ben
    When Ann Reactivates Ben
    And Ben looks for Invitations waiting for them
    Then Ben is offered no Workspaces
