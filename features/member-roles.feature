Feature: Member Roles
  An Admin makes anyone in their Workspace an Admin or a Member, other
  Admins and themselves included. A Workspace always keeps an Admin, and a
  new Role holds from that Member's next action.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    And Cara is signed in

  @api
  Scenario: An Admin makes a Member an Admin, who can then invite
    When Ann makes Ben an Admin
    And Ben invites Cara
    Then Cara is emailed an Invitation to "Acme"

  @api
  Scenario: An Admin made a Member again can no longer invite
    Given Ann has made Ben an Admin
    When Ann makes Ben a Member
    And Ben invites Cara
    Then Ben is told they may not invite people

  @api
  Scenario: An Admin makes another Admin a Member, the founder included
    Given Ann has made Ben an Admin
    When Ben makes Ann a Member
    And Ben looks at who is in Ann's Workspace
    Then Ben sees these Members, earliest first:
      | Member | Role   |
      | Ann    | MEMBER |
      | Ben    | ADMIN  |

  @api
  Scenario: The only Admin cannot make themselves a Member
    When Ann makes Ann a Member
    Then Ann is told to make someone else an Admin first

  @api
  Scenario: A Member cannot change Roles
    When Ben makes Ben an Admin
    Then Ben is told they may not change Roles

  @api
  Scenario: An Admin cannot change the Role of someone in another Workspace
    Given Dan owns a Workspace called "Globex"
    When Ann makes Dan an Admin
    Then Ann is told Dan is not a Member there
