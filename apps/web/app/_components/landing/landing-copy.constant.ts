/**
 * Every word the landing page shows, in one place, so translating it later is one file rather than
 * a search through the sections. The research behind each claim is in the brain's notes of
 * 2026-09-11 and 2026-09-28; a figure stays here only with its source beside it. What the page says
 * a visitor can do is what a Member can do today; anything planned waits under `onTheWay`.
 */
export const LANDING_COPY = {
  meta: {
    title: 'Thrive: honest feedback starts with a question',
    description:
      'Thrive helps your team ask each other for advice, answer in their own words, and choose who gets to read it. Built for founders who don’t have an HR team.',
  },
  nav: {
    signIn: 'Sign in',
  },
  hero: {
    /** Split so the last words can carry the hand-drawn underline; read together, one sentence. */
    headlineStart: 'Honest feedback starts with ',
    headlineMark: 'a question.',
    note: 'no HR team needed',
    lead: 'Thrive helps your team ask each other for advice, answer in their own words, and choose who gets to read it.',
    cta: 'Get started',
    tourLink: 'See it in action',
    ctaNote: 'Sign in with Google and invite your team in minutes.',
  },
  tour: {
    /** The section's fragment, which the hero's link and a shared address both use. */
    id: 'tour',
    title: 'Try it before you sign in',
    switchLabel: 'Tour chapters',
    chapters: [
      { tab: 'my-requests', title: 'Ask for advice' },
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
  problem: {
    title: 'Silence isn’t agreement.',
    note: 'sound familiar?',
    lead: 'In a growing team, people hold back. Not because they have nothing to say, but because saying it feels risky.',
    reasons: [
      {
        title: 'It feels risky',
        body: 'Nobody wants to be the one who said the awkward thing, least of all to someone more senior.',
      },
      {
        title: 'Nothing changed last time',
        body: 'If speaking up led nowhere before, there is little reason to try again.',
      },
      {
        title: 'Nobody wants to lose face',
        body: 'Criticism in front of others costs everyone, so it rarely gets said at all.',
      },
    ],
    closer:
      'A direct, private question changes that. It gives people permission to be honest.',
  },
  research: {
    title: 'Every choice in Thrive comes from research',
    note: 'we did the reading',
    findings: [
      {
        figure: '34%',
        claim:
          'Asked for advice instead of feedback, people named 34% more areas to improve and 56% more ways to improve.',
        source: 'Harvard Business School, 2019',
        inThrive:
          'So in Thrive you ask for advice on a Topic, never for a score.',
      },
      {
        figure: '80%',
        claim:
          '80% of employees who received meaningful feedback in the past week are fully engaged.',
        source: 'Gallup',
        inThrive: 'So asking takes one sentence, and answering takes one box.',
      },
      {
        figure: '#1',
        claim:
          'Psychological safety was the strongest predictor of team effectiveness across more than 180 teams.',
        source: 'Google, Project Aristotle',
        inThrive:
          'So Feedback is private by default, and the person who asks decides who else reads it.',
      },
    ],
  },
  today: {
    title: 'Everything you need to start. Nothing you don’t.',
    note: 'all of it works today',
    features: [
      {
        title: 'Ask for advice',
        body: 'Pick a Topic, like a launch, a pitch or a habit, and ask the teammates who saw it.',
      },
      {
        title: 'Answer in your own words',
        body: 'One answer, with your name on it. No forms and no ratings.',
      },
      {
        title: 'Give feedback unasked',
        body: 'When something deserves to be said, say it, without waiting to be asked.',
      },
      {
        title: 'Choose who reads it',
        body: 'Only you, the people you pick, or everyone in your Workspace.',
      },
      {
        title: 'Tie it to what matters',
        body: 'Tag Feedback with the goals your Admins set, like #ownership.',
      },
      {
        title: 'Mention a teammate',
        body: 'Type @ to name someone in what you write, so the team knows who it’s about.',
      },
    ],
    onTheWayTitle: 'On the way',
    onTheWay: [
      'Discord',
      'Insights for Admins',
      'Notifications and reminders',
      'Personal goals',
    ],
  },
  founders: {
    title: 'Made for founders without an HR team',
    note: 'this one’s for you',
    lead: 'At 20 to 50 people, you are the culture. Thrive gives you a simple way to start it.',
    points: [
      {
        title: 'Set up in minutes',
        body: 'Sign in with Google, name your Workspace and invite your teammates by email.',
      },
      {
        title: 'Go first',
        body: 'Ask your team for advice on how you lead. When the founder asks, everyone else follows.',
      },
      {
        title: 'Run it yourself',
        body: 'Invite people, make someone an Admin, or deactivate someone who has left. No HR team needed.',
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
    tagline: 'Feedback culture for growing teams.',
  },
} as const;
