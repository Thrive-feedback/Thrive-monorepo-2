'use client';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlusIcon } from 'lucide-react';
import { useId, useRef } from 'react';
import { usePrefersReducedMotion } from '@/app/(signed-in)/(sidebar)/_lib/use-prefers-reduced-motion';
import { MAX_TEMPLATE_QUESTION_LENGTH } from '@/app/(signed-in)/(sidebar)/settings/one-on-ones/_lib/one-on-one-template.util';
import { Button } from '@/components/atoms/button';
import { DragHandle } from '@/components/atoms/drag-handle';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { RemoveButton } from '@/components/molecules/remove-button';
import { cn } from '@/lib/cn.util';

/** One question being written, with a key of its own so a move or removal never moves another's text. */
export type QuestionRow = { readonly key: number; readonly text: string };

type QuestionItemProps = {
  question: QuestionRow;
  position: number;
  disabled: boolean;
  /** Whether it is the one to take focus once drawn (the question before one removed), asked once. */
  claimsFocus: () => boolean;
  onChange: (text: string) => void;
  onRemove: () => void;
};

/** One question, drawn as an agenda's topic is: its grip, its words, and Remove at the end. */
function QuestionItem({
  question,
  position,
  disabled,
  claimsFocus,
  onChange,
  onRemove,
}: QuestionItemProps) {
  const reducedMotion = usePrefersReducedMotion();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: question.key,
    disabled,
    transition: reducedMotion ? null : undefined,
  });
  const name = question.text.trim() || `question ${position}`;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        // As an agenda's row: padded all round so a lifted one reads as a card, the list pulled out
        // by as much so the words line up with the fields above.
        'relative flex min-h-10 items-center gap-2 border-border-subtle border-b bg-surface-raised px-3 py-1.5 last:border-b-0',
        isDragging && 'z-10 rounded-control border-transparent shadow-med',
      )}
    >
      <DragHandle
        ref={setActivatorNodeRef}
        aria-label={`Move ${name}`}
        disabled={disabled}
        {...attributes}
        {...listeners}
      />
      {/* Its words stay editable in place, drawn as plain text until it has focus. */}
      <input
        ref={(input) => {
          if (input && claimsFocus()) {
            input.focus();
          }
        }}
        aria-label={`Question ${position}`}
        value={question.text}
        maxLength={MAX_TEMPLATE_QUESTION_LENGTH}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="min-w-0 flex-1 truncate rounded-element bg-transparent px-1 py-1 text-body-1 text-fg-primary outline-none focus-visible:outline-2 focus-visible:outline-action-primary"
      />
      <RemoveButton
        aria-label={`Remove ${name}`}
        disabled={disabled}
        onClick={onRemove}
      />
    </li>
  );
}

export type TemplateQuestionsProps = {
  questions: readonly QuestionRow[];
  onQuestionsChange: (questions: readonly QuestionRow[]) => void;
  /** What is written in Add a question and not added yet; kept with the template if it is saved. */
  adding: string;
  onAddingChange: (text: string) => void;
  /** Gives a new question its key. */
  nextKey: () => number;
  disabled: boolean;
  isFull: boolean;
  /** Told when a question is picked up and put down, so Escape cancels the move and not the dialog. */
  onMovingChange: (isMoving: boolean) => void;
};

/**
 * A template's questions, laid out as a meeting's agenda is while it is prepared: each a row with a
 * grip to drag it into place and a × to take it out, and Add a question under them. A question's
 * words can still be changed where they are.
 */
export function TemplateQuestions({
  questions,
  onQuestionsChange,
  adding,
  onAddingChange,
  nextKey,
  disabled,
  isFull,
  onMovingChange,
}: TemplateQuestionsProps) {
  const id = useId();
  const addInput = useRef<HTMLInputElement>(null);
  /** The question to put focus in once it is drawn: the one before a removal. */
  const focusKey = useRef<number | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    onMovingChange(false);
    if (!over || active.id === over.id) {
      return;
    }
    const from = questions.findIndex((row) => row.key === active.id);
    const to = questions.findIndex((row) => row.key === over.id);
    onQuestionsChange(arrayMove([...questions], from, to));
  }

  function remove(index: number) {
    const before = questions[index - 1] ?? questions[index + 1];
    focusKey.current = before?.key ?? null;
    onQuestionsChange(questions.filter((_, at) => at !== index));
    if (!before) {
      addInput.current?.focus();
    }
  }

  function add() {
    const text = adding.trim();
    if (text === '' || isFull) {
      return;
    }
    onQuestionsChange([...questions, { key: nextKey(), text }]);
    onAddingChange('');
    addInput.current?.focus();
  }

  return (
    <div className="flex flex-col gap-2">
      {questions.length > 0 && (
        <DndContext
          id={`${id}-questions-dnd`}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={() => onMovingChange(true)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => onMovingChange(false)}
          accessibility={{
            screenReaderInstructions: {
              draggable:
                'To move a question, press Space, use the arrow keys, then press Space to drop it, or Escape to cancel.',
            },
          }}
        >
          <SortableContext
            items={questions.map((row) => row.key)}
            strategy={verticalListSortingStrategy}
          >
            <ol className="-mx-3 flex flex-col">
              {questions.map((question, index) => (
                <QuestionItem
                  key={question.key}
                  question={question}
                  position={index + 1}
                  disabled={disabled}
                  claimsFocus={() => {
                    const claims = focusKey.current === question.key;
                    if (claims) {
                      focusKey.current = null;
                    }
                    return claims;
                  }}
                  onChange={(text) =>
                    onQuestionsChange(
                      questions.map((row, at) =>
                        at === index ? { ...row, text } : row,
                      ),
                    )
                  }
                  onRemove={() => remove(index)}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}
      {/* Not a form of its own: it sits inside the template's, so Enter adds rather than saves. */}
      <div className="flex gap-2">
        <Label htmlFor={`${id}-add`} className="sr-only">
          Add a question
        </Label>
        <Input
          ref={addInput}
          id={`${id}-add`}
          value={adding}
          maxLength={MAX_TEMPLATE_QUESTION_LENGTH}
          placeholder={
            questions.length === 0
              ? 'For example, what slowed us down?'
              : 'Add a question'
          }
          disabled={disabled || isFull}
          onChange={(event) => onAddingChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add();
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || isFull || adding.trim() === ''}
          prefixIcon={<PlusIcon aria-hidden="true" className="size-4" />}
          onClick={add}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
