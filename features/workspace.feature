Feature: Workspace
  A founder introduces themselves and creates the Workspace their team will use,
  becoming its Owner. A person belongs to one Workspace.

  @api
  Scenario: A founder creates a Workspace and becomes its Owner
    Given Ann is signed in
    And Ann has introduced themselves
    When Ann creates a Workspace called "Acme"
    Then Ann is the Owner of "Acme"

  @api
  Scenario: Someone who has not introduced themselves cannot create a Workspace
    Given Ann is signed in
    When Ann creates a Workspace called "Acme"
    Then Ann is told to introduce themselves first

  @api
  Scenario: Someone already in a Workspace cannot create another
    Given Ann owns a Workspace called "Acme"
    When Ann creates a Workspace called "Globex"
    Then Ann is told they already belong to a Workspace

  @api
  Scenario: A Member sees who is in their Workspace
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    When Ben looks at who is in Ann's Workspace
    Then Ben sees these Members, earliest first:
      | Member | Role   |
      | Ann    | OWNER  |
      | Ben    | MEMBER |

  @api
  Scenario: Members see each other's Google photo
    Given Ann owns a Workspace called "Acme"
    And Ann's Google account has a photo
    And Ben is a Member of Ann's Workspace
    When Ben looks at who is in Ann's Workspace
    Then Ben sees Ann's Google photo
    And Ben sees no photo for Ben

  @api
  Scenario: Someone outside a Workspace cannot see who is in it
    Given Ann owns a Workspace called "Acme"
    And Cara owns a Workspace called "Globex"
    When Cara looks at who is in Ann's Workspace
    Then Cara is told it cannot be found
