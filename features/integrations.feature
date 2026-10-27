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
  Scenario: An Admin disconnects, and Thrive leaves the server
    Given Ann has connected Discord and chosen the "general" channel
    When Ann disconnects Discord
    Then Thrive has left the Discord server
    And Ann's Workspace has connected nothing

  @api
  Scenario: Disconnecting forgets the Connection, so connecting again starts over
    Given Ann has connected Discord and chosen the "general" channel
    And Ann has disconnected Discord
    When Ann looks at what Ann's Workspace has connected
    Then Ann's Workspace has connected nothing

  @api
  Scenario: The Connection goes even when Discord will not let Thrive leave
    Given Ann has connected Discord and chosen the "general" channel
    And Discord will not let Thrive leave
    When Ann disconnects Discord
    Then Ann's Workspace has connected nothing

  @api
  Scenario: A Member who is not an Admin cannot disconnect
    Given Ann has connected Discord and chosen the "general" channel
    When Ben disconnects Discord from Ann's Workspace
    Then Ben is told they may not manage Integrations

  @api
  Scenario: Disconnecting when nothing is connected says so
    When Ann disconnects Discord
    Then Ann is told nothing is connected

  @api
  Scenario: A channel the bot cannot post in connects nothing
    Given Discord will not let Thrive post
    When Ann connects Discord and chooses the "standups" channel
    Then Ann is told Thrive could not post there
    And Ann's Workspace has connected nothing

  @api
  Scenario: Feedback shown to the whole Workspace reaches the channel
    Given Ben has introduced themselves
    And Ann has connected Discord and chosen the "general" channel
    When Ann gives Ben Feedback: "Running the planning meeting", shared with everyone in the Workspace
    Then the "general" channel is told that Ann gave Ben feedback
    And the "general" channel is told nothing of what the Feedback said

  @api
  Scenario: Feedback for the Receiver alone never reaches the channel
    Given Ann has connected Discord and chosen the "general" channel
    When Ann gives Ben Feedback: "Running the planning meeting", shared with nobody else
    Then nothing more arrives in the "general" channel

  @api
  Scenario: A Kudos reaches the channel, carrying what it said
    Given Ben has introduced themselves
    And Ann has connected Discord and chosen the "general" channel
    When Ann gives Kudos: "@Ben carried the launch"
    Then the "general" channel is told that Ann gave Ben kudos saying "carried the launch"
