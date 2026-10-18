Feature: Workspace
  A founder introduces themselves and creates the Workspace their team will use,
  becoming its first Admin. A person can belong to several Workspaces, and is in
  the one they used last until they switch.

  @api
  Scenario: A founder creates a Workspace and becomes its first Admin
    Given Ann is signed in
    And Ann has introduced themselves
    When Ann creates a Workspace called "Acme"
    Then Ann is an Admin of "Acme"

  @api
  Scenario: Someone who has not introduced themselves cannot create a Workspace
    Given Ann is signed in
    When Ann creates a Workspace called "Acme"
    Then Ann is told to introduce themselves first

  @api
  Scenario: Someone already in a Workspace creates another and keeps the first
    Given Ann owns a Workspace called "Acme"
    When Ann creates a Workspace called "Globex"
    Then Ann belongs to "Acme" and "Globex"

  @api
  Scenario: A founder is in the Workspace they just created
    Given Ann owns a Workspace called "Acme"
    When Ann creates a Workspace called "Globex"
    Then Ann is in "Globex"

  @api
  Scenario: A Member switches to another of their Workspaces
    Given Ann owns a Workspace called "Acme"
    And Dan owns a Workspace called "Globex"
    And Ann is a Member of Dan's Workspace
    When Ann switches to "Acme"
    Then Ann is in "Acme"

  @api
  Scenario: Nobody can switch to a Workspace they are not in
    Given Ann owns a Workspace called "Acme"
    And Cara owns a Workspace called "Globex"
    When Cara switches to Ann's Workspace
    Then Cara is told it cannot be found

  @api
  Scenario: Someone Deactivated in the Workspace they are in is moved to the one they used before
    Given Ann owns a Workspace called "Acme"
    And Dan owns a Workspace called "Globex"
    And Ann is a Member of Dan's Workspace
    When Dan Deactivates Ann
    Then Ann is in "Acme"

  @api
  Scenario: A Member sees who is in their Workspace
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    When Ben looks at who is in Ann's Workspace
    Then Ben sees these Members, earliest first:
      | Member | Role   |
      | Ann    | ADMIN  |
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
