import pandas as pd

from app.database import SessionLocal
from app.models import Question, Option, QuestionType

db = SessionLocal()

# Read CSV
df = pd.read_csv("data/computer_networks_exam_questions.csv")

for _, row in df.iterrows():

    # Create Question
    question = Question(
        subject=row["subject"],
        question_type=QuestionType(row["question_type"]),
        difficulty=row["difficulty"],
        text=row["text"],
        expected_answer=row["expected_answer"] if pd.notna(row["expected_answer"]) else None,
        model_answer=row["model_answer"] if pd.notna(row["model_answer"]) else None,
        marks=int(row["marks"])
    )

    db.add(question)
    db.flush()      # Generates question.id

    # Add options for MCQ / Multi Select
    if row["question_type"] in ["mcq", "multi_select"]:

        options = str(row["options"]).split(",")

        for opt in options:

            option = Option(
                question_id=question.id,
                text=opt.strip(),
                is_correct=(opt.strip() == str(row["expected_answer"]).strip())
            )

            db.add(option)

db.commit()
db.close()

print("Questions imported successfully!")