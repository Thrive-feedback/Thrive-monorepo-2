/**
 * Every word the front page for HR shows (brain `ADR-0061`), in one place. They are the draft from
 * the chosen design, *The post room*, and are to be rewritten; what `ADR-0061` fixes is the order of
 * the sections, not these words. The page names no customer, figure or price it cannot stand
 * behind, and promises nothing about how fast anyone answers. A `\n` in a section's title is where
 * it breaks on wide screens, which is where its handwritten note hangs.
 */
/** The closing section, where every Book a demo leads while a demo has nowhere to be booked. */
const DEMO_SECTION_ID = 'book-demo';

export const HR_LANDING_COPY = {
  meta: {
    title: 'Thrive for HR: make feedback a habit, not a form you chase',
    description:
      'Thrive gives your team one place to ask how it went, give feedback unasked and say thanks, right after it happens. You set it up once, and never chase anyone.',
  },
  /**
   * Where every Book a demo goes. TODO(kritpavin): where a demo is booked is not decided yet
   * (brain ADR-0061, Still open 2); until it is, each one leads to the closing section.
   */
  demoHref: `#${DEMO_SECTION_ID}`,
  nav: {
    faq: 'FAQ',
    signIn: 'Sign in',
    demo: 'Book a demo',
  },
  hero: {
    eyebrow: 'For whoever looks after the people at a growing company',
    headline: 'Make feedback a habit, not a form you chase.',
    note: 'no more December scramble',
    lead: 'Thrive gives your team one place to ask how it went, give feedback unasked and say thanks, right after it happens. You set it up once. You never chase anyone.',
    demo: 'Book a demo',
    teams: 'See what your team sees',
    demoNote: 'A 30-minute call with the people who build Thrive.',
    /** The three postcards beside the promise: one of each kind, from a made-up team. */
    cards: {
      ask: {
        label: 'Asked · right after sprint planning',
        text: 'Where did we lose time this morning?',
      },
      give: {
        label: 'Gave · after the client call',
        text: 'You let them finish before you answered. It calmed the whole room.',
      },
      kudos: {
        label: 'Kudos',
        before: 'Thanks',
        mention: '@Ploy',
        after: 'for covering the release on Friday.',
      },
    },
    postmark: { top: 'Thrive', bottom: 'HR', centre: ['HR', 'OFFICE'] },
    caption: 'A made-up team.',
  },
  problem: {
    id: 'google-form',
    title: 'You already run feedback.\nIt’s a Google Form.',
    note: 'sound familiar?',
    lead: 'You build it, send it, chase it, and read it alone. Then you do it again next round.',
    items: [
      {
        title: 'It comes once a round.',
        body: 'By then nobody remembers what happened in March.',
      },
      {
        title: 'You do the chasing.',
        body: 'Three reminders later, half the team has answered.',
      },
      {
        title: 'It comes back “looks good”.',
        body: 'A box that says “any feedback?” gets the safest answer there is.',
      },
    ],
  },
  roles: {
    id: 'how-it-works',
    title: 'You set it up.\nYour team keeps it going.',
    note: 'not one more process',
    lead: 'Thrive is not one more process for you to run. It’s a place your people use on their own.',
    yours: {
      heading: 'What you do',
      steps: [
        {
          title: 'Create your Workspace',
          body: 'and invite people by email.',
        },
        {
          title: 'Make your team leads Admins',
          body: 'and ask them to go first: one question to their team, this week.',
        },
        {
          title: 'Add your company values',
          body: 'as Workspace Goals, so feedback can point at them.',
          goal: '#ownership',
        },
      ],
    },
    theirs: {
      heading: 'What your team does',
      items: [
        {
          title: 'Ask how it went',
          body: 'right after the meeting, the demo or the launch.',
          voice: 'ask',
        },
        {
          title: 'Give feedback unasked',
          body: 'good or hard, while it still matters.',
          voice: 'give',
        },
        {
          title: 'Say thanks',
          body: 'with Kudos, pinned to a board the whole company can see.',
          voice: 'thanks',
        },
        {
          title: 'Get told',
          body: 'in Thrive, or in Discord, when someone asks them or writes to them.',
          voice: 'plain',
        },
      ],
    },
  },
  promise: {
    id: 'privacy',
    eyebrow: 'The promise you can repeat to your team',
    title: 'You run the Workspace. You don’t read their mail.',
    lead: 'People only speak up when they trust where their words go. So in Thrive, the person who writes decides who reads.',
    points: [
      {
        title: 'The writer chooses who reads it:',
        body: 'only the people it’s for, people they pick, or everyone.',
      },
      {
        title: 'Admins read what’s shared with them,',
        body: 'like anyone else. Being HR doesn’t open more.',
      },
      {
        title: 'Notifications carry no words.',
        body: 'They say who did what and link to it, behind a sign-in.',
      },
      { title: 'Nobody is scored.', body: 'No ratings, no rankings.' },
    ],
  },
  insights: {
    id: 'insights',
    badge: 'Coming soon',
    title: 'See where feedback flows, without reading a word.',
    lead: 'Insights will show Admins who asks, who answers and who gives feedback to whom, by name. Which teams talk, and which have gone quiet. Never the message itself.',
    more: 'Book a demo and we’ll show you where it’s heading, and ask what you need from it.',
    sketch: {
      label: 'Sketch · made-up team',
      rows: [
        { who: 'Ana → Ben', what: 'gave feedback 4 times', quiet: false },
        { who: 'Design team', what: 'asked 9 times this month', quiet: false },
        { who: 'Sales team', what: 'quiet for 3 weeks', quiet: true },
      ],
    },
  },
  compare: {
    id: 'compare',
    title: 'Thrive next to what you use today',
    columns: { thrive: 'Thrive', form: 'Google Form', review: 'Annual review' },
    rows: [
      {
        aspect: 'When it happens',
        thrive: 'Right after the moment',
        form: 'Once a round',
        review: 'Once or twice a year',
      },
      {
        aspect: 'Who starts it',
        thrive: 'Anyone on the team',
        form: 'You',
        review: 'You',
      },
      {
        aspect: 'Reminders',
        thrive: 'None. Nobody is chased',
        form: 'You send them',
        review: 'You send them',
      },
      {
        aspect: 'What people write',
        thrive: 'One moment, in their own words',
        form: 'Answers to your questions',
        review: 'Ratings and a summary',
      },
      {
        aspect: 'Who reads it',
        thrive: 'Whoever wrote it decides',
        form: 'Whoever owns the sheet',
        review: 'Manager and HR',
      },
      {
        aspect: 'Saying thanks',
        thrive: 'Kudos, on a board everyone sees',
        form: 'Not really',
        review: 'Months later',
      },
    ],
  },
  founder: {
    id: 'founder',
    quote: '“Thrive will make the team work together more happily.”',
    body: 'That’s the whole reason we build it. Thrive is made by a small team of Thai people. Your demo is a call with us, the people who write the code, not a sales rep.',
    signature: '[Founder name], founder',
    photo: '[Founder photo]',
  },
  faq: {
    id: 'faq',
    title: 'Questions HR asks first',
    items: [
      {
        question: 'Can I read everyone’s feedback?',
        answer:
          'No. Whoever writes it chooses who reads it: only the people it’s for, people they pick, or everyone in the Workspace. As an Admin you read what’s shared with you, like anyone else.',
      },
      {
        question: 'Then what do I get to see?',
        answer:
          'Today: everyone in the Workspace and their Roles, the Workspace feed and the Kudos board. Coming soon, Insights: who asked and gave feedback to whom, by name, and how often. Never the message.',
      },
      {
        question: 'Is feedback anonymous?',
        answer:
          'No. Every piece of feedback carries its writer’s name. Thrive works by asking people directly, which gives them permission to be honest.',
      },
      {
        question: 'Can I remind people who haven’t answered?',
        answer:
          'No, on purpose. Thrive tells people when someone asks them, in the app and in Discord if they link it. It never nags.',
      },
      {
        question: 'How do we get started?',
        answer:
          'Sign in, create a Workspace, and invite people by email. Then ask your team leads to go first.',
      },
      {
        question: 'Does it work with Slack?',
        answer: 'Discord today. Slack is coming soon.',
      },
      {
        question: 'What happens when someone leaves?',
        answer:
          'An Admin turns off their access. The feedback they gave and received stays.',
      },
      {
        question: 'How much does it cost?',
        answer: '[Pricing not decided]. Ask us on the demo call.',
      },
    ],
  },
  closing: {
    id: DEMO_SECTION_ID,
    to: 'To:',
    address: 'whoever looks after the people',
    title: 'Let’s get your team talking before the next review.',
    body: '30 minutes. We show you Thrive with a made-up team and answer your questions.',
    demo: 'Book a demo',
    signIn: 'or sign in and try it yourself',
  },
} as const;
