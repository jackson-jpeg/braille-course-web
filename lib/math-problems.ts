/**
 * Math problems for the Number Sense braille game.
 */

export interface MathProblem {
  operands: number[];
  operator: string;
  answer: number;
  display: string; // e.g. "3 + 5"
}

/** Generate a math problem based on difficulty params */
export function generateProblem(
  maxNumber: number,
  operations: string[]
): MathProblem {
  const op = operations[Math.floor(Math.random() * operations.length)];
  let a: number, b: number, answer: number;

  switch (op) {
    case '+':
      a = 1 + Math.floor(Math.random() * maxNumber);
      b = 1 + Math.floor(Math.random() * maxNumber);
      answer = a + b;
      return { operands: [a, b], operator: '+', answer, display: `${a} + ${b}` };

    case '-':
      a = 2 + Math.floor(Math.random() * maxNumber);
      b = 1 + Math.floor(Math.random() * Math.min(a - 1, maxNumber));
      answer = a - b;
      return { operands: [a, b], operator: '-', answer, display: `${a} - ${b}` };

    case '×':
      a = 2 + Math.floor(Math.random() * Math.min(maxNumber, 12));
      b = 2 + Math.floor(Math.random() * Math.min(maxNumber, 12));
      answer = a * b;
      return { operands: [a, b], operator: '×', answer, display: `${a} × ${b}` };

    default:
      a = 1 + Math.floor(Math.random() * maxNumber);
      b = 1 + Math.floor(Math.random() * maxNumber);
      answer = a + b;
      return { operands: [a, b], operator: '+', answer, display: `${a} + ${b}` };
  }
}

/** Generate multiple-choice wrong answers */
export function generateChoices(correctAnswer: number, count: number = 3): number[] {
  const choices = new Set<number>([correctAnswer]);
  const range = Math.max(5, Math.ceil(correctAnswer * 0.3));

  while (choices.size < count + 1) {
    const offset = 1 + Math.floor(Math.random() * range);
    const wrong = Math.random() > 0.5
      ? correctAnswer + offset
      : Math.max(0, correctAnswer - offset);
    if (wrong !== correctAnswer) choices.add(wrong);
  }

  return [...choices].sort(() => Math.random() - 0.5);
}
