Feature: Deactivating Members, and leaving
  Deactivating ends someone's access to a Workspace and keeps everything they
  gave and received there. Anyone can Deactivate themselves, which is how they
  leave; an Admin can also Deactivate anyone else, other Admins included. A
  Workspace always keeps an active Admin.

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
