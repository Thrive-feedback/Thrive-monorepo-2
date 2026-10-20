Feature: Workspace Goals in Feedback
  A Member writes a Workspace Goal into Feedback, a request's Topic or an answer as a hashtag.
  When it is sent, every hashtag naming an active Workspace Goal, in any letter case, binds it
  for good and reads in the Admin's spelling. Anything else stays plain text. Hiding a Workspace
  Goal later changes nothing already sent, and an answer carries only what its Giver wrote.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace
    And Ann has added the Workspace Goal "ownership"
    And Ann has added the Workspace Goal "ownershic"

  @api
  Scenario Outline: Feedback is bound to every active Workspace Goal it names, once each
    Given Ann has given Ben Feedback on "<topic>": "<body>"
    When Ben looks at the Feedback written to them
    Then Ben reads it tagged with "<tags>"

    Examples:
      | topic                 | body                                                 | tags                 |
      | The launch            | Great work last week #ownershic #Ownership #notalist | #ownershic #ownership |
      | The launch #OWNERSHIP | And again, #ownership                                | #ownership           |

  @api
  Scenario: A Workspace Goal hidden before sending binds nothing
    Given Ann has hidden the Workspace Goal "ownershic"
    And Ann has given Ben Feedback on "The launch": "Great work last week #ownershic"
    When Ben looks at the Feedback written to them
    Then Ben reads it tagged with nothing

  @api
  Scenario: Hiding a Workspace Goal later leaves Feedback bound to it
    Given Ann has given Ben Feedback on "The launch": "Great work last week #ownershic"
    And Ann has hidden the Workspace Goal "ownershic"
    When Ben looks at the Feedback written to them
    Then Ben reads it tagged with "#ownershic"

  @api
  Scenario: An answer carries only the Workspace Goals its Giver wrote
    Given Ben has asked Ann for Feedback on "How did the launch go? #ownership"
    And Ann has answered "You saw it through #ownershic"
    When Ben looks at the Feedback written to them
    Then Ben reads it tagged with "#ownershic"

  @api
  Scenario: The Requester reads their request's Topic tagged with its Workspace Goals
    Given Ben has asked Ann for Feedback on "How did the launch go? #Ownership #teamwork"
    When Ben looks at the requests they have sent
    Then Ben sees the request tagged with "#ownership"

  @api
  Scenario: The Member asked still reads the Topic tagged after the Workspace Goal is hidden
    Given Ben has asked Ann for Feedback on "How did the launch go? #ownership"
    And Ann has hidden the Workspace Goal "ownership"
    When Ann looks at what they have been asked
    Then Ann sees the Ask tagged with "#ownership"
