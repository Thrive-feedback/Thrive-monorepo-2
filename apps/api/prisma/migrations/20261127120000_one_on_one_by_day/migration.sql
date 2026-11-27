-- A 1:1 is kept by the day, with no time of day: a meeting is that whole day. The time and the
-- length a schedule kept are dropped, at the product owner's call, in one step rather than the
-- expand-then-contract BE_15 asks for; nothing reads them any more.
ALTER TABLE "one_on_one" DROP COLUMN "startMinute",
DROP COLUMN "lengthMinutes";
