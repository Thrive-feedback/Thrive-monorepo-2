Feature: Feedback requests
  A Member asks one or more teammates for Feedback with a Request message. The request is read
  by the person who sent it and the people it asks, and by nobody else; each person asked sees
  only their own Ask, never who else was asked. The Feedback it
  collects is also read by whoever the Requester chose to share it with. When that is everyone
  in the Workspace, the person asked is told before answering that their answer goes on the
  Workspace feed, which names everyone the request asked beside it. Whoever may read an answer
  opens it on the request's postcard, with the other answers they may read.

  Background:
    Given Ann owns a Workspace called "Acme"
    And Ben is a Member of Ann's Workspace

  @api
  Scenario: A Member asks a teammate for Feedback
    When Ann asks Ben for Feedback: "Running the planning meeting"
    Then Ann can open the request saying "Running the planning meeting"
    And Ben can open the request saying "Running the planning meeting"

  @api
  Scenario: A Member sees the requests they have sent
    Given Ann has asked Ben for Feedback: "Running the planning meeting"
    When Ann looks at the requests they have sent
    Then Ann sees a request saying "Running the planning meeting" asking Ben

  @api
  Scenario: A teammate sees what they have been asked
    Given Ann has asked Ben for Feedback: "Running the planning meeting"
    When Ben looks at what they have been asked
    Then Ben sees an Ask from Ann saying "Running the planning meeting" waiting for an answer
    And Ben can open the Ask saying "Running the planning meeting"

  @api
  Scenario Outline: Someone who is not part of a Feedback request cannot open it
    Given Ann has asked Ben for Feedback: "Running the planning meeting"
    And Cara <relationship>
    When Cara opens Ann's Feedback request
    Then Cara is told it cannot be found

    Examples:
      | relationship                     |
      | is a Member of Ann's Workspace   |
      | owns a Workspace called "Globex" |

  @api
  Scenario: The requests a Member has sent are only their own
    Given Cara is a Member of Ann's Workspace
    And Ann has asked Ben for Feedback: "Running the planning meeting"
    And Ben has asked Cara for Feedback: "Reviewing pull requests"
    When Ann looks at the requests they have sent
    Then Ann sees a request saying "Running the planning meeting" asking Ben

  @api
  Scenario: Waiting for me pages through every Ask with one cursor
    Given Ann has asked Ben for Feedback: "First."
    And Ann has asked Ben for Feedback: "Second."
    And Ann has asked Ben for Feedback: "Third."
    When Ben reads what is waiting two at a time to the end
    Then Ben has read what is waiting: "Third." then "Second." then "First."

  @api
  Scenario: Waiting for me reads oldest first when asked
    Given Ann has asked Ben for Feedback: "First."
    And Ann has asked Ben for Feedback: "Second."
    And Ann has asked Ben for Feedback: "Third."
    When Ben reads what is waiting oldest first, two at a time to the end
    Then Ben has read what is waiting: "First." then "Second." then "Third."

  @api
  Scenario: Waiting for me refuses an order it does not offer
    When Ben asks for what is waiting in an order that does not exist
    Then Waiting for me refuses the page size

  @api
  Scenario: Waiting for me holds only what still waits on the reader
    Given Cara is a Member of Ann's Workspace
    And Ann has asked Ben for Feedback: "For Ben, answered."
    And Ben has answered "It kept moving."
    And Ann has asked Cara for Feedback: "For Cara."
    When Ben reads what is waiting two at a time to the end
    Then Ben has nothing waiting

  @api
  Scenario: Waiting for me refuses a page size it does not offer
    When Ben asks for 101 Asks waiting at a time
    Then Waiting for me refuses the page size

  @api
  Scenario: A Member who has not been asked has nothing waiting
    Given Cara is a Member of Ann's Workspace
    And Ann has asked Ben for Feedback: "Running the planning meeting"
    When Cara looks at what they have been asked
    Then Cara has nothing waiting for them

  @api
  Scenario Outline: An Ask is opened by the Member waiting to answer it and by nobody else
    Given Cara is a Member of Ann's Workspace
    And Ann has asked Cara for Feedback: "Reviewing pull requests"
    When <opener> opens the Ask waiting for Cara
    Then <opener> is told the Ask cannot be found

    Examples:
      | opener | who they are           |
      | Ben    | another Member         |
      | Ann    | the Requester who sent it |

  @api
  Scenario Outline: The person asked is told whether their answer goes on the Workspace feed
    Given Ann has asked Ben for Feedback: "Running the planning meeting", shared with <audience>
    When Ben opens the Ask waiting for Ben
    Then Ben is told their answer <placement> on the Workspace feed

    Examples:
      | audience                  | placement   |
      | everyone in the Workspace | goes        |
      | nobody else               | does not go |

  @api
  Scenario: A teammate answers what they were asked, and the Member who asked reads it
    Given Ann has asked Ben for Feedback: "Running the planning meeting"
    When Ben answers "You open strongly and lose the room at the detail."
    Then Ann reads "You open strongly and lose the room at the detail." on the request saying "Running the planning meeting"

  @api
  Scenario: An answered Ask stops waiting
    Given Ann has asked Ben for Feedback: "Running the planning meeting"
    And Ben has answered "You open strongly and lose the room at the detail."
    When Ben looks at what they have been asked
    Then Ben has nothing waiting for them

  @api
  Scenario: An Ask collects one answer, and the first one is final
    Given Ann has asked Ben for Feedback: "Running the planning meeting"
    And Ben has answered "You open strongly and lose the room at the detail."
    When Ben answers "And another thing."
    Then Ben is told the Ask has already been answered

  @api
  Scenario: An Ask is answered by the Member it waits on and by nobody else
    Given Cara is a Member of Ann's Workspace
    And Ann has asked Ben for Feedback: "Running the planning meeting"
    When Cara answers the Ask waiting for Ben
    Then Cara is told the Ask cannot be found

  @api
  Scenario: A Member asks several teammates at once
    Given Cara is a Member of Ann's Workspace
    And Ann has asked Ben and Cara for Feedback: "Running the planning meeting"
    When Ann looks at the requests they have sent
    Then Ann sees a request saying "Running the planning meeting" asking Ben and Cara

  @api
  Scenario Outline: Each teammate asked sees their own Ask waiting
    Given Cara is a Member of Ann's Workspace
    And Ann has asked Ben and Cara for Feedback: "Running the planning meeting"
    When <giver> looks at what they have been asked
    Then <giver> sees an Ask from Ann saying "Running the planning meeting" waiting for an answer

    Examples:
      | giver |
      | Ben   |
      | Cara  |

  @api
  Scenario: A teammate asked does not learn who else was asked
    Given Cara is a Member of Ann's Workspace
    And Ann has asked Ben and Cara for Feedback: "Running the planning meeting"
    When Ben opens Ann's Feedback request
    Then Ben sees only their own Ask on the request

  @api
  Scenario: One teammate outside the Workspace stops the whole request
    Given Dan owns a Workspace called "Globex"
    When Ann asks Ben and Dan for Feedback: "Running the planning meeting"
    Then Ann is told Dan is not in their Workspace
    And Ben has not been asked anything

  @api
  Scenario: A Member cannot ask someone outside their Workspace
    Given Dan owns a Workspace called "Globex"
    When Ann asks Dan for Feedback: "Running the planning meeting"
    Then Ann is told Dan is not in their Workspace

  @api
  Scenario: A teammate sees what they have already answered
    Given Ann has asked Ben for Feedback: "Running the planning meeting"
    And Ben has answered "You open strongly and lose the room at the detail."
    When Ben looks at what they have answered
    Then Ben sees an Ask from Ann saying "Running the planning meeting" that they have answered

  @api
  Scenario: A Member reads the Feedback written to them
    Given Ann has asked Ben for Feedback: "Running the planning meeting"
    And Ben has answered "You open strongly and lose the room at the detail."
    When Ann looks at the Feedback written to them
    Then Ann reads "You open strongly and lose the room at the detail." from Ben

  @api
  Scenario: A Member sees the Google photo of whoever wrote Feedback to them
    Given Ben's Google account has a photo
    And Ann has asked Ben for Feedback: "Running the planning meeting"
    And Ben has answered "You open strongly and lose the room at the detail."
    When Ann looks at the Feedback written to them
    Then Ann sees Ben's Google photo

  @api
  Scenario: A teammate sees the Google photo of the Member who asked them
    Given Ann's Google account has a photo
    And Ann has asked Ben for Feedback: "Running the planning meeting"
    When Ben looks at what they have been asked
    Then Ben sees Ann's Google photo

  @api
  Scenario: Feedback written to one Member is not another Member's to read
    Given Cara is a Member of Ann's Workspace
    And Ann has asked Ben for Feedback: "Running the planning meeting"
    And Ben has answered "You open strongly and lose the room at the detail."
    When Cara looks at the Feedback written to them
    Then Cara has no Feedback written to them

  @api
  Scenario Outline: Feedback from a request reaches the people its Requester chose
    Given Cara is a Member of Ann's Workspace
    And Ann has asked Ben for Feedback: "Running the planning meeting", shared with <audience>
    And Ben has answered "You open strongly and lose the room at the detail."
    When <reader> opens the Feedback Ben wrote
    Then <reader> reads "You open strongly and lose the room at the detail." written by Ben

    Examples:
      | audience                  | reader |
      | nobody else               | Ann    |
      | nobody else               | Ben    |
      | Cara                      | Cara   |
      | everyone in the Workspace | Cara   |

  @api
  Scenario Outline: Feedback from a request reaches nobody its Requester did not choose
    Given Cara is a Member of Ann's Workspace
    And Dan is a Member of Ann's Workspace
    And Ann has asked Ben for Feedback: "Running the planning meeting", shared with <audience>
    And Ben has answered "You open strongly and lose the room at the detail."
    When Cara opens the Feedback Ben wrote
    Then Cara is told the Feedback cannot be found

    Examples:
      | audience    |
      | nobody else |
      | Dan         |

  @api
  Scenario: Feedback shared with everyone stays inside the Workspace
    Given Dan owns a Workspace called "Globex"
    And Ann has asked Ben for Feedback: "Running the planning meeting", shared with everyone in the Workspace
    And Ben has answered "You open strongly and lose the room at the detail."
    When Dan opens the Feedback Ben wrote
    Then Dan is told the Feedback cannot be found

  @api
  Scenario: Sharing with selected people needs somebody to share with
    When Ann asks Ben for Feedback: "Running the planning meeting", shared with selected people but picks nobody
    Then Ann is told to pick somebody to share it with

  @api
  Scenario: A request cannot be shared with somebody outside the Workspace
    Given Dan owns a Workspace called "Globex"
    When Ann asks Ben for Feedback: "Running the planning meeting", shared with Dan
    Then Ann is told they can only share it inside their Workspace

  @api
  Scenario: The Requester sees who they shared a request with
    Given Cara is a Member of Ann's Workspace
    And Ann has asked Ben for Feedback: "Running the planning meeting", shared with Cara
    When Ann opens Ann's Feedback request
    Then Ann sees it is shared with Cara

  @api
  Scenario: A request written on a postcard is read on that postcard
    Given Ann has asked Ben for Feedback on a postcard: "Running the planning meeting"
    When Ben opens Ann's Feedback request
    Then Ben sees the postcard it was written on

  @api
  Scenario: The person asked opens the postcard they answer on
    Given Ann has asked Ben for Feedback on a postcard: "Running the planning meeting"
    When Ben opens the Ask waiting for Ben
    Then Ben sees the postcard it was written on

  @api
  Scenario: The person asked opens no postcard when the request was not written on one
    Given Ann has asked Ben for Feedback: "Running the planning meeting"
    When Ben opens the Ask waiting for Ben
    Then Ben sees no postcard

  @api
  Scenario: An answer written on a postcard is read on that postcard, under the request's
    Given Ann has asked Ben for Feedback on a postcard: "Running the planning meeting"
    And Ben has answered on the postcard: "It kept moving."
    When Ann opens the Feedback Ben wrote
    Then Ann sees the postcard the request was written on
    And Ann sees "It kept moving." as it was written on the postcard

  @api
  Scenario: An answer's stickers stay on the back of the postcard
    Given Ann has asked Ben for Feedback on a postcard: "Running the planning meeting"
    When Ben answers on the postcard with a sticker on its front: "It kept moving."
    Then Ben is told the postcard cannot be sent

  @api
  Scenario: An answer cannot choose the card it is written on
    Given Ann has asked Ben for Feedback on a postcard: "Running the planning meeting"
    When Ben answers choosing the picture of the postcard: "It kept moving."
    Then the request is refused as malformed

  @api
  Scenario: Somebody who has not answered is not on the card
    Given Cara is a Member of Ann's Workspace
    And Ann has asked Ben and Cara for Feedback: "Running the planning meeting"
    And Ben has answered "It kept moving."
    When Ann opens the Feedback Ben wrote
    Then the postcard Ann opened holds only "It kept moving."

  @api
  Scenario: Whoever may read an answer opens the card with every answer they may read
    Given Cara is a Member of Ann's Workspace
    And Dan is a Member of Ann's Workspace
    And Ann has asked Ben and Cara for Feedback: "Running the planning meeting", shared with Dan
    And Ben has answered "It kept moving."
    And Cara has answered "It ran long."
    When Dan opens the Feedback Cara wrote
    Then the postcard Dan opened holds "It kept moving." then "It ran long."

  @api
  Scenario: Everyone in the Workspace opens the card with every answer
    Given Cara is a Member of Ann's Workspace
    And Dan is a Member of Ann's Workspace
    And Ann has asked Ben and Cara for Feedback: "Running the planning meeting", shared with everyone in the Workspace
    And Ben has answered "It kept moving."
    And Cara has answered "It ran long."
    When Dan opens the Feedback Ben wrote
    Then the postcard Dan opened holds "It kept moving." then "It ran long."

  @api
  Scenario: A Giver opens only their own answer when it was kept to the Requester
    Given Cara is a Member of Ann's Workspace
    And Ann has asked Ben and Cara for Feedback: "Running the planning meeting"
    And Ben has answered "It kept moving."
    And Cara has answered "It ran long."
    When Cara opens the Feedback Cara wrote
    Then the postcard Cara opened holds only "It ran long."

  @api
  Scenario: The Requester opens every answer they were sent, in the order they asked
    Given Cara is a Member of Ann's Workspace
    And Ann has asked Ben and Cara for Feedback: "Running the planning meeting"
    And Cara has answered "It ran long."
    And Ben has answered "It kept moving."
    When Ann opens the Feedback Cara wrote
    Then the postcard Ann opened holds "It kept moving." then "It ran long."

  @api
  Scenario: A request's postcard carries three stickers at most
    When Ann asks Ben for Feedback on a postcard with four stickers: "Running the planning meeting"
    Then Ann is told the postcard cannot be sent

  @api
  Scenario: The Giver is not told who else reads their answer
    Given Cara is a Member of Ann's Workspace
    And Ann has asked Ben for Feedback: "Running the planning meeting", shared with Cara
    When Ben opens Ann's Feedback request
    Then Ben is not told who else can read it
