/**
 * Every word the landing page shows, in one place, so translating it later is one file rather than
 * a search through the sections. The research behind each claim is in the brain's notes of
 * 2026-09-11 and 2026-09-28; a figure stays here only with its source beside it.
 */
export const LANDING_COPY = {
  meta: {
    title: 'Thrive: feedback your team will actually give',
    description:
      'Ask your teammates for advice, get honest answers back, and build a feedback culture from day one. No HR team needed.',
  },
  nav: {
    signIn: 'Sign in',
  },
  hero: {
    overline: 'For founders of growing teams',
    headline: 'Your team has things to tell you.',
    headlineBrand: 'Thrive',
    headlineEnd: ' makes it easy to ask.',
    lead: 'Ask your teammates for advice on what matters, get honest answers back, and build a feedback culture from day one. No HR team needed.',
    cta: 'Get started',
    ctaNote: 'Sign in with Google and set up your Workspace in minutes.',
  },
  preview: {
    label: 'Preview of Thrive Home',
    address: 'thriveteam.app/home',
    caption:
      'This is Thrive’s Home, with made-up people in it. Click around: nothing you do here is sent.',
  },
  problem: {
    eyebrow: 'The quiet problem',
    title: 'Silence isn’t agreement.',
    lead: 'In a growing team, people hold back. Problems surface late, and good work goes unnoticed. Not because nobody sees it, but because saying it feels risky.',
    reasons: [
      {
        title: 'Fear of what it costs',
        body: 'Nobody wants to be the one who said the awkward thing to someone more senior.',
      },
      {
        title: 'A sense that nothing changes',
        body: 'If nothing happened the last time someone spoke up, why say it again?',
      },
      {
        title: 'Saving face',
        body: 'Criticism in front of others costs everyone, so it rarely happens at all.',
      },
    ],
    closer:
      'Being asked changes that. A direct, private question gives people permission to answer honestly.',
  },
  howItWorks: {
    eyebrow: 'How it works',
    title: 'From one question to a better next time',
    steps: [
      {
        title: 'Ask for advice',
        body: 'Pick a Topic, like a presentation, a project or a habit, and ask the teammates who saw it.',
      },
      {
        title: 'Get a real answer',
        body: 'Each Giver writes one answer in their own words, with their name on it. No forms, no ratings.',
      },
      {
        title: 'Act on it',
        body: 'Read what came back in one place, and take it into your next attempt.',
      },
    ],
    stats: [
      {
        figure: '34%',
        claim:
          'more areas to improve, and 56% more ways to improve, when people are asked for advice instead of feedback.',
        source: 'Harvard Business School, 2019',
      },
      {
        figure: '80%',
        claim:
          'of employees who received meaningful feedback in the past week are fully engaged.',
        source: 'Gallup',
      },
    ],
  },
  founders: {
    eyebrow: 'For founders',
    title: 'Built for founders without an HR team',
    lead: 'At 20 to 50 people, you are the culture. Thrive gives you a simple way to start it, and to show everyone it is safe to join in.',
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
        title: 'Private by default',
        body: 'Feedback stays between the Giver and the person who asked, unless they choose to share it.',
      },
    ],
    stat: {
      figure: '#1',
      claim:
        'Psychological safety was the strongest predictor of team effectiveness across more than 180 teams.',
      source: 'Google, Project Aristotle',
    },
  },
  platform: {
    eyebrow: 'The platform',
    title: 'One place for how your people grow',
    lead: 'Feedback is where Thrive starts. Everything else builds on it.',
    features: [
      {
        title: 'Feedback',
        body: 'Ask for, give and read feedback, and choose who else can see it.',
      },
      {
        title: 'Goals',
        body: 'Write your own goals and use them as the Topic when you ask for advice.',
      },
      {
        title: 'Insights',
        body: 'See whether feedback is really happening across your Workspace. Totals only, never anyone’s feedback.',
      },
      {
        title: 'Integrations',
        body: 'Ask and answer inside the chat app your team already uses.',
      },
      {
        title: 'Notifications',
        body: 'Know when someone asks you, and get a Reminder before an Ask goes unanswered.',
      },
    ],
    next: 'And next: learning, skills and personal development plans. One HRD platform, starting with the conversation that matters most.',
  },
  finalCta: {
    title: 'Start the conversation your team is waiting for.',
    body: 'All it takes is a Google account and a few minutes.',
    cta: 'Get started',
  },
  footer: {
    tagline: 'Feedback culture for growing teams.',
  },
} as const;
