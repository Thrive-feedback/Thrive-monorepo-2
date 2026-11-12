/**
 * Every word the landing page shows, in one place, so translating it later is one file rather than
 * a search through the sections. The words are the brain's `ADR-0038`, *The words, as agreed*, as
 * `ADR-0054` amends them for the page told as post; change them there first. The page cites no
 * research and promises nothing about how fast an answer arrives. A `\n` in a section's title is
 * where it breaks on wide screens, which is where its handwritten note hangs.
 */
export const LANDING_COPY = {
  meta: {
    title: 'Thrive: feedback while it still matters',
    description:
      'Ask your team how it went, tell a teammate what to try next, or just say thanks, right after it happens. Feedback for anyone who leads a team.',
  },
  nav: {
    signIn: 'Sign in',
  },
  hero: {
    /**
     * Split so the note can hang off the end of the first line and the last words can carry the
     * hand-drawn underline; read together, one sentence.
     */
    headlineStart: 'Feedback while',
    headlineJoin: ' it ',
    headlineMark: 'still matters.',
    note: 'not six months later',
    lead: 'Ask your team how it went, tell a teammate what to try next, or just say thanks, right after it happens. No waiting for the next review.',
    cta: 'Get started',
    ctaNote: 'Sign in and invite your team in minutes.',
  },
  desk: {
    /** Names the desk for assistive technology; the cards on it say the rest. */
    title: 'Try it, then sign in',
    /** Each card on the desk, named for what writing it does. */
    cards: {
      ask: 'Ask how it went',
      give: 'Give feedback unasked',
      kudos: 'Say thanks',
    },
    /** What each card's dialog is titled, as the app titles it. */
    dialogTitles: { ask: 'Ask for feedback', give: 'Give feedback' },
    /** The arrows that turn the fan, bringing the card beside the front one to the front. */
    previous: 'Bring the card on the left to the front',
    next: 'Bring the card on the right to the front',
    caption: 'A made-up team. Nothing you write here is sent.',
    /**
     * Once a postcard goes: a success, as it would be in a team, then
     * the truth, since the made-up team lives only on this page and nothing is sent.
     */
    sent: {
      title: 'Sent successfully',
      description:
        'In your team, it would go to the people you picked. Here, nothing was sent.',
    },
  },
  moments: {
    id: 'moments',
    title: 'Two moments\nthat shouldn’t wait',
    note: 'sound familiar?',
    /**
     * Each told the way good asking and giving goes: one moment, one thing, what to try next. The
     * words are what is written on the card, without quotation marks: the page quotes them.
     */
    items: [
      {
        when: 'Right after sprint planning',
        who: 'Team lead',
        kind: 'asked',
        said: 'I’m working on shorter meetings. Where did we lose time this morning?',
        reply:
          'We spent 20 minutes on a ticket nobody had read. Next time, share the board the day before.',
        hint: 'Say what you’re working on.',
      },
      {
        when: 'After rehearsing the final presentation',
        who: 'Student project lead',
        kind: 'gave',
        said: 'In the run-through just now, you started the demo before explaining the problem, so I didn’t know what I was looking at. Next time, explain the problem first.',
        reply: 'Makes sense. I’ll put the problem first on the day.',
        hint: 'What happened → how it landed → what to try next.',
      },
    ],
    kinds: { asked: 'Asked', gave: 'Gave' },
    replyLabel: 'What came back',
    /** Names each Moment's card, which opens to read: "Read the card: Right after sprint planning". */
    read: 'Read the card:',
    /** Over a Moment's card opened to read, as the app titles one: "Feedback from Ben Carter". */
    readTitle: 'Feedback from',
    closer:
      'Without Thrive, both wait for the review, the retro or the final grade.',
  },
  board: {
    /** The section's id, so the page can link to it; "Go to Kudos board" scrolls to the card itself. */
    id: 'kudos-board',
    title: 'Say thanks where\nthe whole team can see it',
    note: 'pin it up',
    lead: 'Every Kudos goes up on the team’s board, just as it was written.',
    yours: 'Yours. Only on this page.',
    /** A caption under each card: who gave it, and to whom. */
    from: 'From',
    to: 'to',
    everyone: 'everyone',
  },
  why: {
    title: 'Honest feedback\nstarts with a question.',
    note: 'it’s not you',
    lead: 'People rarely stay quiet because they have nothing to say. The feedback waits for a meeting weeks away, and by then it feels too late, or too risky, to bring up.',
    reasons: [
      {
        title: 'It waits too long.',
        body: 'By the next review, nobody remembers the details.',
        /** By hand, beside the card it points at, in the card's own colour. */
        note: 'asked the same morning',
        inThrive:
          'So you ask or speak up right after it happens. One sentence is enough.',
      },
      {
        title: 'It feels risky.',
        body: 'Nobody wants to say the awkward thing, least of all to their boss.',
        note: 'just for Ploy',
        inThrive:
          'So whoever writes it chooses who reads it: one person, the people they pick, or the whole team.',
      },
      {
        title: 'It comes out vague.',
        body: 'Asked “any feedback?”, people say “looks good”.',
        note: 'one moment, one thing',
        inThrive:
          'So you ask about one moment and one thing to try next. No scores.',
      },
    ],
    closer: 'A direct question gives people permission to be honest.',
  },
  today: {
    title: 'Everything\nThrive does',
    note: 'all in one place',
    /** Each is a card; its voice is the hue of the act it names. */
    features: [
      {
        title: 'Ask how it went',
        body: 'Name the moment and ask the people who were there. They answer in their own words. No forms, no ratings.',
        voice: 'ask',
      },
      {
        title: 'Give feedback unasked',
        body: 'Don’t wait to be asked. If something is worth saying, good or hard, say it.',
        voice: 'give',
      },
      {
        title: 'Kudos',
        body: 'A quick thank-you, on a card the whole team can see.',
        voice: 'thanks',
      },
      {
        title: 'Choose who reads it',
        body: 'Just the person it’s for, the people you pick, or the whole team.',
        voice: 'give',
      },
      {
        title: 'Works with Discord',
        body: 'Get a message in Discord when someone asks you, answers you or writes to you.',
        voice: 'paper',
      },
      {
        title: 'See if it’s working',
        body: 'Know whether feedback is flowing across your team, without reading a word of it.',
        voice: 'paper',
      },
    ],
  },
  envelope: {
    from: 'From',
    to: 'To',
    /** The envelope's address, and the closing section's heading. */
    address: 'Whoever leads the team',
    /** Struck round the postmark across the envelope's stamp, and in its middle. */
    postmark: { top: 'Thrive', bottom: 'Team', centre: ['FIRST', 'CLASS'] },
    lead: 'A founder, a team lead, someone in HR, or the head of a student project. If you lead people, you shape how they talk to each other.',
    /**
     * Each point is a step, numbered by hand in the blue of asking: "step 1", "step 2". The page
     * names no sign-in provider, since more than Google are on the way.
     */
    step: 'step',
    points: [
      {
        title: 'Bring your team in',
        body: 'Sign in, create a Workspace for your team, and invite people by email.',
      },
      {
        title: 'Go first',
        body: 'Ask your team how you’re doing. When you ask, it’s easier for everyone else to speak up.',
      },
      {
        title: 'Run it yourself',
        body: 'Invite new people, make a teammate an Admin, or turn off access for someone who has left.',
      },
    ],
    title: 'Start the conversation your team is waiting for.',
    body: 'All it takes is a few minutes.',
    cta: 'Get started',
    note: 'see you inside',
  },
  footer: {
    tagline: 'Feedback while it still matters.',
  },
} as const;
