Feature: Connecting a chat tool
  An Admin adds the Thrive bot to their team's Discord server and picks one
  channel in it, which is told about public Feedback from then on. A message
  has to arrive in that channel before anything is stored, so a Connection
  that has never worked cannot exist. Only an Admin may connect one; every
  Member may see which channel their Workspace posts in.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace

  @api
  Scenario: An Admin connects a server and chooses a channel
    When Ann connects Discord and chooses the "standups" channel
    Then a message arrives in the "standups" channel
    And Ann sees "Acme HQ" and "standups" connected by Ann

  @api
  Scenario: Connecting again replaces the Connection, because a Workspace has one
    Given Ann has connected Discord and chosen the "general" channel
    When Ann connects Discord and chooses the "standups" channel
    Then Ann sees "Acme HQ" and "standups" connected by Ann

  @api
  Scenario: Every Member sees which channel their Workspace posts in
    Given Ann has connected Discord and chosen the "general" channel
    When Ben looks at what Ann's Workspace has connected
    Then Ben sees "Acme HQ" and "general" connected by Ann

  @api
  Scenario: A Member who is not an Admin cannot connect anything
    When Ben begins connecting Discord to Ann's Workspace
    Then Ben is told they may not manage Integrations

  @api
  Scenario: Somebody outside the Workspace is told it does not exist
    Given Cara is signed in
    When Cara begins connecting Discord to Ann's Workspace
    Then Cara is told that Workspace does not exist

  @api
  Scenario: A return Thrive did not start is refused
    When Ann comes back from Discord with a state nobody signed
    Then Ann is told the install did not start here

  @api
  Scenario: A channel the tool never offered is refused, and nothing is connected
    When Ann connects Discord and chooses the "someone-elses" channel
    Then Ann is told that channel was not offered
    And Ann's Workspace has connected nothing

  @api
  Scenario: A channel the bot cannot post in connects nothing
    Given Discord will not let Thrive post
    When Ann connects Discord and chooses the "standups" channel
    Then Ann is told Thrive could not post there
    And Ann's Workspace has connected nothing
