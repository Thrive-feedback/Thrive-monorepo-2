/**
 * Every word the landing page shows, in one place, so translating it later is one file rather than
 * a search through the sections. The words are the brain's `ADR-0038`, *The words, as agreed*,
 * section by section; change them there first. The page cites no research and promises nothing
 * about how fast an answer arrives, since nothing notifies anybody yet. A `\n` in a section's title
 * is where it breaks on wide screens, which is where its handwritten note hangs.
 */
export const LANDING_COPY = {
  meta: {
    title: 'Thrive: feedback while it still matters',
    description:
      'Ask your team how it went, tell a teammate what to try next, or just say thanks, right after it happens. Thrive is feedback for anyone who leads a team.',
  },
  nav: {
    signIn: 'Sign in',
    languageLabel: 'Language',
    english: 'EN',
    thai: 'TH',
    thaiComing: 'Thai is coming soon',
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
    tourLink: 'See it in action',
    ctaNote: 'Sign in with Google and invite your team in minutes.',
  },
  tour: {
    /** The section's fragment, which the hero's link and a shared address both use. */
    id: 'tour',
    title: 'Try it, then sign in',
    switchLabel: 'Tour chapters',
    chapters: [
      { tab: 'my-requests', title: 'Ask how it went' },
      { tab: 'waiting', title: 'Answer what you’re asked' },
      { tab: 'workspace', title: 'See what the team shares' },
      { tab: 'received', title: 'Read what’s written to you' },
    ],
    aside: 'Go on, click around',
  },
  preview: {
    label: 'Preview of Thrive Home',
    caption: 'A made-up team. Nothing you do here is sent.',
  },
  moments: {
    title: 'Four moments\nthat shouldn’t wait',
    note: 'sound familiar?',
    /** Each told the way good asking and giving goes: one moment, one thing, what to try next. */
    items: [
      {
        when: '10 minutes after the investor pitch',
        who: 'Founder',
        kind: 'asked',
        said: '“In today’s pitch, what’s one thing I should change before the next one?”',
        reply:
          '“When you opened with market size, the room went quiet. When you told Mai’s story, they leaned in. Next time, open with the story.”',
        hint: 'Name the moment. Ask for one thing.',
      },
      {
        when: 'Right after sprint planning',
        who: 'Team lead',
        kind: 'asked',
        said: '“I’m working on shorter meetings. Where did we lose time this morning?”',
        reply:
          '“We spent 20 minutes on a ticket nobody had read. Next time, share the board the day before.”',
        hint: 'Say what you’re working on.',
      },
      {
        when: 'After the final presentation rehearsal',
        who: 'Student project lead',
        kind: 'gave',
        said: '“In our run-through just now, the demo started before you explained the problem, so I didn’t know what I was looking at. Next time, explain the problem first.”',
        reply: '“That makes sense. I’ll swap them before the final.”',
        hint: 'What happened → what it changed → what to try next.',
      },
      {
        when: 'A new hire’s first week',
        who: 'HR',
        kind: 'kudos',
        said: '“Your onboarding notes answered every question our new designer had. She shipped her first screen on day three. Thank you!”',
        reply: null,
        hint: 'Praise the thing you want to see again.',
      },
    ],
    kinds: { asked: 'Asked', gave: 'Gave', kudos: 'Kudos' },
    replyLabel: 'What came back',
    closer:
      'Without Thrive, each of these waits for the review, the retro or the final grade.',
  },
  why: {
    title: 'Honest feedback\nstarts with a question.',
    note: 'it’s not you',
    lead: 'Feedback rarely goes missing because people have nothing to say. It waits for a meeting weeks away, and by then it feels too risky to say.',
    reasons: [
      {
        title: 'It waits for the cycle.',
        body: 'By the review, the details are gone.',
        inThrive:
          'So you ask or give the moment something happens, in one sentence.',
      },
      {
        title: 'It feels risky.',
        body: 'Nobody wants to say the awkward thing, least of all to someone more senior.',
        inThrive:
          'So whoever writes it chooses who reads it: one person, the people they pick, or the whole team.',
      },
      {
        title: 'It comes out vague.',
        body: 'Asked “any feedback?”, people say “looks good”.',
        inThrive:
          'So you ask about one moment and what to try next, never for a score.',
      },
    ],
    closer: 'A direct question gives people permission to be honest.',
  },
  today: {
    title: 'Everything you need to start.\nNothing you don’t.',
    note: 'all in one place',
    features: [
      {
        title: 'Ask how it went',
        body: 'Name the moment and ask the people who were there. They answer in their own words. No forms, no ratings.',
      },
      {
        title: 'Give feedback unasked',
        body: 'When something deserves to be said, good or hard, say it.',
      },
      {
        title: 'Kudos',
        body: 'The fastest way to tell a teammate they did well.',
      },
      {
        title: 'Choose who reads it',
        body: 'Only them, the people you pick, or your whole team.',
      },
      {
        title: 'Works with Discord',
        body: 'Get a Discord message when someone asks you for feedback or writes to you.',
      },
      {
        title: 'See if it’s working',
        body: 'See whether feedback is happening across your team, without reading anyone’s feedback.',
      },
    ],
  },
  leads: {
    title: 'Made for whoever leads the team',
    note: 'this one’s for you',
    lead: 'A founder, a team lead, someone in HR, or the head of a student project. If you lead people, you shape how they talk to each other.',
    points: [
      {
        title: 'Set up in minutes',
        body: 'Sign in with Google, name your team’s space, and invite people by email.',
      },
      {
        title: 'Go first',
        body: 'Ask your team how you’re doing. When the lead asks, everyone else follows.',
      },
      {
        title: 'Run it yourself',
        body: 'Invite people, share the admin work, or remove someone who has left.',
      },
    ],
  },
  finalCta: {
    title: 'Start the conversation your team is waiting for.',
    note: 'see you inside',
    body: 'All it takes is a Google account and a few minutes.',
    cta: 'Get started',
  },
  footer: {
    tagline: 'Feedback while it still matters.',
  },
} as const;
