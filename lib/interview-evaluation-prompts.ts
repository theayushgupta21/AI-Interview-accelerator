
type EvaluationInput = {
  roleTitle: string;
  question: string;
  answer: string;
  evaluationPoints: string[];
};

export function buildAnswerEvaluationPrompt(input: EvaluationInput) {
  const evaluationPoints = input.evaluationPoints
    .slice(0, 3)
    .map((point) => `- ${point}`)
    .join("\n");

  return {
    systemPrompt: `
You are a fair technical interviewer.
Evaluate only the candidate's submitted answer.
Do not assume skills or experience that are not demonstrated.
Accept valid alternative approaches and equivalent terminology.

Return one valid JSON object with exactly these fields:
score: integer from 0 to 100
feedback: concise string, maximum 100 words
strengths: array of 0 to 3 short strings
improvements: array of 0 to 3 short strings
missed_points: array of 0 to 3 short strings
follow_up_question: one concise, relevant question
follow_up_reason: one short sentence

Always include every field. Never omit an array.
Use [] when there are no strengths, improvements, or missed points.
Do not include markdown fences or text outside the JSON object.
Score based on correctness, relevance, reasoning, and coverage.
Strong answers should receive deeper follow-ups.
Weak answers should receive simpler clarifying follow-ups.
`.trim(),

    userPrompt: `
Role: ${input.roleTitle.slice(0, 120)}
Question: ${input.question.slice(0, 500)}
Expected evaluation points:
${evaluationPoints}
Candidate answer:
${input.answer.slice(0, 2500)}

Evaluate the answer and generate one relevant follow-up.
Do not repeat the original question.
If the answer is empty or says "I don't know", evaluate that honestly
and ask a supportive foundational follow-up.
`.trim(),
  };
}
