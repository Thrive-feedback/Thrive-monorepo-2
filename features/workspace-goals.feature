Feature: Workspace Goals
  An Admin sets the Workspace's goals as short hashtags, each with an optional
  description. They are never renamed or deleted, only hidden and shown again.
  Admins see hidden and active ones; every other Member reads the active ones.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace

  @api
  Scenario: An Admin adds a Workspace Goal, which every Member reads
    When Ann adds the Workspace Goal "ownership" described as "We finish what we start."
    And Ben looks at the Workspace Goals
    Then Ben sees these Workspace Goals:
      | Name      | Description              | Status |
      | ownership | We finish what we start. | ACTIVE |

  @api
  Scenario Outline: A Workspace Goal's name is refused when it breaks a rule
    Given Ann has added the Workspace Goal "Ownership"
    When Ann adds the Workspace Goal "<name>"
    Then Ann is told the name <reason>

    Examples:
      | name                            | reason                  |
      | ship it                         | may not contain spaces  |
      | a-name-that-is-much-too-long-xx | is too long             |
      | OWNERSHIP                       | is already taken        |

  @api
  Scenario: A hidden Workspace Goal's name stays taken
    Given Ann has added the Workspace Goal "ownership"
    And Ann has hidden the Workspace Goal "ownership"
    When Ann adds the Workspace Goal "Ownership"
    Then Ann is told the name is already taken

  @api
  Scenario: An Admin still sees a hidden Workspace Goal, marked hidden
    Given Ann has added the Workspace Goal "ownership"
    And Ann has added the Workspace Goal "ownershic"
    When Ann hides the Workspace Goal "ownershic"
    And Ann looks at the Workspace Goals
    Then Ann sees these Workspace Goals:
      | Name      | Description | Status |
      | ownershic |             | HIDDEN |
      | ownership |             | ACTIVE |

  @api
  Scenario: A Member never sees a hidden Workspace Goal until it is shown again
    Given Ann has added the Workspace Goal "ownership"
    And Ann has hidden the Workspace Goal "ownership"
    And Ben sees no Workspace Goals
    When Ann shows the Workspace Goal "ownership" again
    And Ben looks at the Workspace Goals
    Then Ben sees these Workspace Goals:
      | Name      | Description | Status |
      | ownership |             | ACTIVE |

  @api
  Scenario: A Member cannot add a Workspace Goal
    When Ben adds the Workspace Goal "ownership"
    Then Ben is told they may not manage Workspace Goals

  @api
  Scenario: A Member cannot hide a Workspace Goal
    Given Ann has added the Workspace Goal "ownership"
    When Ben hides the Workspace Goal "ownership"
    Then Ben is told they may not manage Workspace Goals

  @api
  Scenario: Another Workspace never sees them
    Given Ann has added the Workspace Goal "ownership"
    And Dan owns a Workspace called "Globex"
    When Dan looks at the Workspace Goals
    Then Dan sees no Workspace Goals
