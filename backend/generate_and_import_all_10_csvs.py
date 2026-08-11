import sys
import os
import csv
import io

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models import QuestionLibrary, Question, QuestionType, Option

def generate_and_import():
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    os.makedirs(data_dir, exist_ok=True)

    subjects = [
        ("Computer Science & Programming", "computer_science_60_questions.csv"),
        ("Mathematics & Quantitative Aptitude", "mathematics_60_questions.csv"),
        ("Physics & Engineering Mechanics", "physics_60_questions.csv"),
        ("Chemistry & Materials Science", "chemistry_60_questions.csv"),
        ("Data Structures & Algorithms", "data_structures_60_questions.csv"),
        ("Database Management Systems (DBMS)", "dbms_60_questions.csv"),
        ("Operating Systems & Computer Networks", "operating_systems_60_questions.csv"),
        ("Web Development & Fullstack Tech", "web_development_60_questions.csv"),
        ("Software Engineering & DevOps", "software_engineering_60_questions.csv"),
        ("Artificial Intelligence & Machine Learning", "ai_ml_60_questions.csv")
    ]

    db = SessionLocal()
    types = ["mcq", "multi_select", "short_answer", "long_answer"]
    difficulties = ["easy", "medium", "hard"]

    for lib_title, filename in subjects:
        file_path = os.path.join(data_dir, filename)
        subject_clean = lib_title.split('&')[0].strip()

        # 1. Write CSV file
        with open(file_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["subject", "question_type", "difficulty", "text", "options", "expected_answer", "model_answer", "marks"])

            for i in range(1, 61):
                q_type = types[(i - 1) % len(types)]
                diff = difficulties[(i - 1) % len(difficulties)]
                marks = 2 if diff == "medium" else (3 if diff == "hard" else 1)
                text = f"Evaluated {subject_clean} Question #{i}: What is the primary characteristic of {subject_clean} concept #{i}?"
                options = "Option A, Option B, Option C, Option D" if "mcq" in q_type or "select" in q_type else ""
                expected = "Option A" if "mcq" in q_type or "select" in q_type else "Expected core concept"
                model_ans = f"Model solution explaining {subject_clean} principles for question #{i}." if "answer" in q_type else ""

                writer.writerow([subject_clean, q_type, diff, text, options, expected, model_ans, marks])

        # 2. Seed Library & Import into DB
        lib = db.query(QuestionLibrary).filter(QuestionLibrary.title == lib_title).first()
        if not lib:
            lib = QuestionLibrary(title=lib_title, purpose=f"CSV imported question bank for {lib_title}")
            db.add(lib)
            db.commit()
            db.refresh(lib)

        # Clear old questions for this library to ensure clean 60 imported questions
        existing_qs = db.query(Question).filter(Question.library_id == lib.id).all()
        for eq in existing_qs:
            db.query(Option).filter(Option.question_id == eq.id).delete()
            db.delete(eq)
        db.commit()

        # Import 60 questions from generated CSV
        with open(file_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                q_type = row["question_type"]
                q = Question(
                    library_id=lib.id,
                    subject=row["subject"],
                    question_type=q_type,
                    difficulty=row["difficulty"],
                    text=row["text"],
                    marks=int(row["marks"]),
                    negative_marks=0.5 if row["difficulty"] != "easy" else 0,
                    model_answer=row["model_answer"] if row["model_answer"] else None,
                    expected_answer=row["expected_answer"] if row["expected_answer"] else None,
                    options=[
                        Option(text="Option A: Primary standard implementation", is_correct=True),
                        Option(text="Option B: Secondary alternative approach", is_correct=False),
                        Option(text="Option C: Edge case handling variant", is_correct=False),
                        Option(text="Option D: Deprecated legacy method", is_correct=False),
                    ] if q_type in ("mcq", "multi_select") else []
                )
                db.add(q)
            db.commit()

        print(f"Generated & Imported CSV: {filename} into library '{lib_title}' (60 questions)")

    db.close()
    print("SUCCESS: All 10 Subject CSV files generated in backend/data/ and imported into database!")

if __name__ == "__main__":
    generate_and_import()
