import sys
import os
from datetime import datetime

# Ensure app is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models import QuestionLibrary, Question, QuestionType, Option

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    libraries_data = [
        ("Computer Science & Programming", "Core programming concepts, syntax, and paradigms"),
        ("Mathematics & Quantitative Aptitude", "Algebra, Calculus, Discrete Math, and Probability"),
        ("Physics & Engineering Mechanics", "Newtonian Physics, Thermodynamics, and Electromagnetism"),
        ("Chemistry & Materials Science", "Organic Chemistry, Physical Chemistry, and Material Properties"),
        ("Data Structures & Algorithms", "Arrays, Trees, Graphs, Sorting, and Dynamic Programming"),
        ("Database Management Systems (DBMS)", "Relational Algebra, SQL, Normalization, and NoSQL"),
        ("Operating Systems & Computer Networks", "Processes, Memory Management, TCP/IP, and Routing"),
        ("Web Development & Fullstack Tech", "HTML, CSS, JavaScript, React, Next.js, and REST APIs"),
        ("Software Engineering & DevOps", "Agile, Testing, CI/CD, Docker, and Architecture"),
        ("Artificial Intelligence & Machine Learning", "Neural Networks, Regression, Classification, and NLP")
    ]

    types = [QuestionType.mcq, QuestionType.multi_select, QuestionType.short_answer, QuestionType.long_answer]
    difficulties = ["easy", "medium", "hard"]

    for title, purpose in libraries_data:
        existing_lib = db.query(QuestionLibrary).filter(QuestionLibrary.title == title).first()
        if not existing_lib:
            lib = QuestionLibrary(title=title, purpose=purpose)
            db.add(lib)
            db.commit()
            db.refresh(lib)
        else:
            lib = existing_lib

        # Check existing count
        existing_q_count = db.query(Question).filter(Question.library_id == lib.id).count()

        if existing_q_count < 60:
            questions_to_add = 60 - existing_q_count
            for i in range(1, questions_to_add + 1):
                q_num = existing_q_count + i
                q_type = types[(i - 1) % len(types)]
                diff = difficulties[(i - 1) % len(difficulties)]

                q_text = f"Sample {title} Question #{q_num}: Evaluate the fundamental principles of {title.split('&')[0].strip()} for problem scenario #{q_num}."

                opts = []
                if q_type in (QuestionType.mcq, QuestionType.multi_select):
                    opts = [
                        Option(text="Option A: Primary standard implementation", is_correct=True),
                        Option(text="Option B: Secondary alternative approach", is_correct=False),
                        Option(text="Option C: Edge case handling variant", is_correct=False),
                        Option(text="Option D: Deprecated legacy method", is_correct=False),
                    ]

                q = Question(
                    library_id=lib.id,
                    subject=title.split('&')[0].strip(),
                    question_type=q_type,
                    difficulty=diff,
                    text=q_text,
                    marks=2 if diff == "medium" else (3 if diff == "hard" else 1),
                    negative_marks=0 if diff == "easy" else 1,
                    options=opts,
                    model_answer=f"Standard model answer for {title} question #{q_num} explaining key theoretical concepts." if q_type in (QuestionType.short_answer, QuestionType.long_answer) else None,
                    expected_answer="Option A: Primary standard implementation" if q_type in (QuestionType.mcq, QuestionType.multi_select) else "Key concept verification"
                )
                db.add(q)
            db.commit()

    db.close()
    print("SUCCESS: 10 Subject Question Libraries with 60 questions each seeded successfully!")

if __name__ == "__main__":
    seed()
