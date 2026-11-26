'use client';

import { PlusIcon, XIcon } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import type {
  OneOnOneActionResult,
  OneOnOneTemplateScope,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import {
  isKeepable,
  MAX_TEMPLATE_NAME_LENGTH,
  MAX_TEMPLATE_QUESTION_LENGTH,
  MAX_TEMPLATE_QUESTIONS,
  MAX_TEMPLATE_SUGGESTED_WHEN_LENGTH,
  type TemplateDraft,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-template.util';
import { useOneOnOneAction } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/use-one-on-one-action';
import { Button } from '@/components/atoms/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/atoms/dialog';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { RadioGroup, RadioGroupItem } from '@/components/atoms/radio-group';
import { Text } from '@/components/atoms/text';
import { TextField } from '@/components/molecules/text-field';

/** Who a template being kept is for: the person alone, or everyone in the Workspace. */
export type KeptScope = Exclude<OneOnOneTemplateScope, 'THRIVE'>;

export type TemplateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What opens it, which takes focus back when it closes. */
  trigger: React.ReactNode;
  title: string;
  description: string;
  /**
   * Where the writing starts: empty, a copy, or the template being rewritten. Given as a function of
   * who it is for, a copy's name follows the choice until the person writes one of their own.
   */
  initial: TemplateDraft | ((scope: KeptScope) => TemplateDraft);
  /**
   * Offered to an Admin keeping a new one: who it is for, starting from `scope`. Left out, it is
   * kept where `scope` says without asking, as a rewrite stays in its layer.
   */
  chooseScope?: { readonly workspaceName: string };
  scope: KeptScope;
  submitLabel: string;
  /** Said once it went. */
  done: string;
  onSubmit: (
    draft: TemplateDraft,
    scope: KeptScope,
  ) => Promise<OneOnOneActionResult>;
};

type FormProps = Omit<
  TemplateDialogProps,
  'open' | 'trigger' | 'title' | 'description'
>;

/** One question being written, with a key of its own so a removal never moves another's text. */
type QuestionRow = { readonly key: number; readonly text: string };

/**
 * The fields and buttons, drawn only while the dialog is open, so each opening starts again from
 * `initial` rather than from writing left by Cancel.
 */
function TemplateForm({
  onOpenChange,
  initial,
  chooseScope,
  scope: initialScope,
  submitLabel,
  done,
  onSubmit,
}: FormProps) {
  const id = useId();
  const startFor = (forScope: KeptScope): TemplateDraft =>
    typeof initial === 'function' ? initial(forScope) : initial;
  const start = startFor(initialScope);
  const nextKey = useRef(start.questions.length);
  /** Whether the person wrote the name; until then it follows who the template is for. */
  const nameWritten = useRef(false);
  /** The question to put focus in once it is drawn: one just added, or the one before a removal. */
  const focusKey = useRef<number | null>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const [name, setName] = useState(start.name);
  const [suggestedWhen, setSuggestedWhen] = useState(start.suggestedWhen);
  const [scope, setScope] = useState<KeptScope>(initialScope);
  const [questions, setQuestions] = useState<readonly QuestionRow[]>(() =>
    start.questions.map((text, key) => ({ key, text })),
  );
  const { isPending, run } = useOneOnOneAction();
  const draft: TemplateDraft = {
    name,
    suggestedWhen,
    questions: questions.map((question) => question.text),
  };
  const isFull = questions.length >= MAX_TEMPLATE_QUESTIONS;

  function changeScope(value: string) {
    if (value !== 'PERSONAL' && value !== 'WORKSPACE') {
      return;
    }
    setScope(value);
    if (!nameWritten.current) {
      setName(startFor(value).name);
    }
  }

  function addQuestion() {
    const key = nextKey.current++;
    focusKey.current = key;
    setQuestions((rows) => [...rows, { key, text: '' }]);
  }

  function removeQuestion(index: number) {
    const before = questions[index - 1] ?? questions[index + 1];
    focusKey.current = before?.key ?? null;
    setQuestions((rows) => rows.filter((_, at) => at !== index));
    if (!before) {
      addButton.current?.focus();
    }
  }

  function changeQuestion(index: number, text: string) {
    setQuestions((rows) =>
      rows.map((row, at) => (at === index ? { ...row, text } : row)),
    );
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    run(() => onSubmit(draft, scope), {
      done,
      onSuccess: () => onOpenChange(false),
    });
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={submit}>
      {chooseScope && (
        <div className="flex flex-col gap-2">
          <Text as="p" id={`${id}-scope`} variant="label">
            Who it’s for
          </Text>
          <RadioGroup
            aria-labelledby={`${id}-scope`}
            value={scope}
            onValueChange={changeScope}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="PERSONAL" id={`${id}-personal`} />
              <Label htmlFor={`${id}-personal`}>Just me</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="WORKSPACE" id={`${id}-workspace`} />
              <Label htmlFor={`${id}-workspace`}>
                Everyone in {chooseScope.workspaceName}
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}
      <TextField
        label="Name"
        required
        value={name}
        maxLength={MAX_TEMPLATE_NAME_LENGTH}
        placeholder="For example, Sprint retro"
        disabled={isPending}
        onChange={(event) => {
          nameWritten.current = true;
          setName(event.currentTarget.value);
        }}
      />
      <TextField
        label="When to use it"
        value={suggestedWhen}
        maxLength={MAX_TEMPLATE_SUGGESTED_WHEN_LENGTH}
        placeholder="Optional. For example, after each sprint"
        disabled={isPending}
        onChange={(event) => setSuggestedWhen(event.currentTarget.value)}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 flex w-full items-baseline justify-between gap-3">
          <Text as="span" variant="label">
            Questions the agenda opens with
          </Text>
          <Text
            as="span"
            variant="body-3"
            tone="muted"
            className="tabular-nums"
          >
            {questions.length} of {MAX_TEMPLATE_QUESTIONS}
          </Text>
        </legend>
        <ol className="flex flex-col gap-2">
          {questions.map((question, index) => (
            <li key={question.key} className="flex items-center gap-2">
              <Text
                as="span"
                variant="body-3"
                tone="muted"
                aria-hidden="true"
                className="w-5 shrink-0 text-end tabular-nums"
              >
                {index + 1}
              </Text>
              <Input
                ref={(input) => {
                  if (input && focusKey.current === question.key) {
                    focusKey.current = null;
                    input.focus();
                  }
                }}
                aria-label={`Question ${index + 1}`}
                placeholder={
                  index === 0 ? 'For example, what slowed us down?' : undefined
                }
                value={question.text}
                maxLength={MAX_TEMPLATE_QUESTION_LENGTH}
                disabled={isPending}
                className="min-w-0 flex-1"
                onChange={(event) =>
                  changeQuestion(index, event.currentTarget.value)
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove question ${index + 1}`}
                disabled={isPending || questions.length === 1}
                onClick={() => removeQuestion(index)}
              >
                <XIcon aria-hidden="true" className="size-4" />
              </Button>
            </li>
          ))}
        </ol>
        <div className="ps-7">
          <Button
            ref={addButton}
            type="button"
            variant="ghost"
            size="sm"
            prefixIcon={<PlusIcon aria-hidden="true" className="size-4" />}
            disabled={isPending || isFull}
            onClick={addQuestion}
          >
            Add a question
          </Button>
        </div>
      </fieldset>
      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          disabled={isPending}
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isPending}
          disabled={!isKeepable(draft)}
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Writing a 1:1 template: its name, when to use it, and up to 12 questions each agenda opens with,
 * in order. A new one may be the person's own or, for an Admin, everyone's.
 */
export function TemplateDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  ...form
}: TemplateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="gap-5">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {open && <TemplateForm onOpenChange={onOpenChange} {...form} />}
      </DialogContent>
    </Dialog>
  );
}
