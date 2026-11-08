import { GallerySection } from '@/app/ui-showcase/_components/gallery-section';
import { ShowcasePage } from '@/app/ui-showcase/_components/showcase-page';
import {
  CHANNEL_POSTS,
  type ChannelPost,
  NOTIFICATION_KINDS,
  type NotificationKind,
} from '@/app/ui-showcase/notifications/_lib/notification-kinds.constant';
import { Badge } from '@/components/atoms/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/atoms/card';
import { Text } from '@/components/atoms/text';
import { NotificationRowSkeleton } from '@/components/organisms/notification-row';
import type { NotificationType } from '@/lib/notifications/notification.type';
import {
  NOTIFICATION_LINES,
  notificationLine,
} from '@/lib/notifications/notification-copy.constant';
import { SampleBell } from './sample-bell';

/** The name the sentences on this page are written with. */
const SAMPLE_ACTOR = 'Ann Lee';

/** The id the paths on this page are written with, so a reader sees where the id goes. */
const SAMPLE_SUBJECT = '{id}';

/**
 * Every kind in the order a request moves through them. Read from the bell's own copy, so this
 * page cannot show a kind the bell does not know.
 */
const KIND_ORDER = Object.keys(NOTIFICATION_LINES).filter(isNotificationType);

function isNotificationType(key: string): key is NotificationType {
  return key in NOTIFICATION_KINDS;
}

const WHAT_PRESSING_DOES = [
  'Marks the line read. Its dot goes and the bell’s count drops by one straight away, before the server has answered.',
  'Follows the line’s link to the page it points at.',
  'Closes the panel.',
] as const;

const RULES_FOR_EVERY_KIND = [
  'Nobody is told about their own action.',
  'One person gets one notification per thing, even when they are named twice.',
  'A Deactivated Member is never told.',
  'Somebody with no name to show, who has not introduced themselves or whose Account is gone, is called “Somebody”, so the line still reads as a sentence.',
  'A line names who did what. It never carries what anybody wrote.',
] as const;

type FactProps = {
  term: string;
  children: React.ReactNode;
};

function Fact({ term, children }: FactProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-subtitle-4">{term}</dt>
      <dd className="text-body-2 text-fg-secondary">{children}</dd>
    </div>
  );
}

type KindCardProps = {
  type: NotificationType;
  kind: NotificationKind;
};

/** One kind: the line the bell draws for it, and everything about when and where it goes. */
function KindCard({ type, kind }: KindCardProps) {
  const { sentence, destination } = notificationLine({
    type,
    actorName: SAMPLE_ACTOR,
    subjectId: SAMPLE_SUBJECT,
  });

  return (
    <Card>
      <CardHeader className="gap-2">
        <Badge className="self-start">{type}</Badge>
        <CardTitle as="h3">{kind.title}</CardTitle>
        <Text variant="body-1">“{sentence}”</Text>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-3">
          <Fact term="When">{kind.when}</Fact>
          <Fact term="Who is told">{kind.whoIsTold}</Fact>
          <Fact term="Pressing it opens">
            {kind.opens}{' '}
            <Text as="span" variant="code" tone="default">
              {destination}
            </Text>
          </Fact>
          <Fact term="In Discord">{kind.inChat}</Fact>
        </dl>
      </CardContent>
    </Card>
  );
}

type ChannelPostCardProps = {
  post: ChannelPost;
};

function ChannelPostCard({ post }: ChannelPostCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h3">{post.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-3">
          <Fact term="When">{post.when}</Fact>
          <Fact term="What it says">{post.carries}</Fact>
          <Fact term="Its link opens">{post.linksTo}</Fact>
        </dl>
      </CardContent>
    </Card>
  );
}

/**
 * Every notification Thrive sends: the four kinds a person is told about, in the bell and in
 * Discord, and the two a Workspace's channel is told about. The bell lines are the real copy and
 * the real row, on sample data.
 */
export function NotificationGallery() {
  return (
    <ShowcasePage
      title="Notifications"
      description={
        <>
          Everything Thrive tells people. What raises each one, who is told,
          what the bell says, and where pressing it goes. A Member who linked
          Discord also gets each one as a direct message. A Workspace that
          connected a channel is told about two more.
        </>
      }
    >
      <GallerySection
        title="Every kind"
        description="The four things a person is told about. Each one is a line in their bell, and a Discord message if they linked Discord. The sentence and the path are the bell’s own, with a sample name and {id} where the real id goes."
      >
        <div className="grid gap-6 md:grid-cols-2">
          {KIND_ORDER.map((type) => (
            <KindCard key={type} type={type} kind={NOTIFICATION_KINDS[type]} />
          ))}
        </div>
      </GallerySection>

      <GallerySection
        title="What pressing a line does"
        description="The same for every kind."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle as="h3">Pressing one line</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <ol className="flex list-decimal flex-col gap-2 ps-5 text-body-2">
                {WHAT_PRESSING_DOES.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <Text variant="body-2" tone="muted">
                “Mark all as read” marks every line and leaves the panel open,
                so the lines stay on screen as already seen. A line is a link,
                so a middle click opens it in a new tab.
              </Text>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle as="h3">Who is told, and how often</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <ul className="flex list-disc flex-col gap-2 ps-5 text-body-2">
                {RULES_FOR_EVERY_KIND.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
              <Text variant="body-2" tone="muted">
                The bell asks for its count every minute, and not at all while
                the tab is hidden. It asks again as soon as the tab comes back.
              </Text>
            </CardContent>
          </Card>
        </div>
      </GallerySection>

      <GallerySection
        title="In the bell"
        description="The panel with the real row on sample lines: one of every kind unread, one already read, and one from somebody with no name. Pressing a line marks it read here and follows its real link, which takes a sample id nowhere useful."
      >
        <SampleBell />
        <figure className="flex max-w-88 flex-col gap-2">
          <Card className="py-2">
            <NotificationRowSkeleton />
          </Card>
          <Text as="figcaption" variant="caption" tone="muted">
            One line while the panel is loading, at the height the real line
            will be.
          </Text>
        </figure>
      </GallerySection>

      <GallerySection
        title="In the Workspace’s channel"
        description="Posted to the Discord channel a Workspace connected, for everyone in it. These never reach the bell, and giving Kudos tells nobody in the bell at all."
      >
        <div className="grid gap-6 md:grid-cols-2">
          {CHANNEL_POSTS.map((post) => (
            <ChannelPostCard key={post.title} post={post} />
          ))}
        </div>
      </GallerySection>
    </ShowcasePage>
  );
}
