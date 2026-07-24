export type Question = {
  id: string;
  subject: string;
  question_type: string;
  difficulty: string;
  text: string;
  marks: number;
  negative_marks: number;
  model_answer?: string | null;
  expected_answer?: string | null;
  tags?: string[];
};