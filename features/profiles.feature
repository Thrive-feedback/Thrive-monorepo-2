Feature: Profiles
  A person introduces themselves once, by their full name and the name their
  team calls them, and Thrive knows them by it from then on.

  @api
  Scenario: A person introduces themselves
    Given Ann is signed in
    When Ann introduces themselves
    Then Ann is known as "Ann", with the full name "Ann Lee"

  @api
  Scenario: A person introduces themselves only once
    Given Ann is signed in
    And Ann has introduced themselves
    When Ann introduces themselves
    Then Ann is told they have already introduced themselves
