from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.auth import hash_password
from app.database import Base, get_db
from app.main import app
from app.models import Question, QuestionType, User, UserRole


@pytest.fixture()
def client():
    engine = create_engine("sqlite:///:memory:")
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c, TestingSessionLocal
    app.dependency_overrides.clear()


def _create_user(db, email, role=UserRole.student):
    user = User(
        email=email,
        hashed_password=hash_password("password"),
        full_name=email,
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_mcq_requires_exactly_one_correct_option(client):
    test_client, session_factory = client
    db = session_factory()
    examiner = _create_user(db, "examiner@example.com", role=UserRole.examiner)
    db.close()

    login_response = test_client.post(
        "/auth/login",
        data={"username": examiner.email, "password": "password"},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    response = test_client.post(
        "/questions/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "subject": "math",
            "question_type": "mcq",
            "difficulty": "easy",
            "text": "Pick one option",
            "marks": 2,
            "options": [
                {"text": "A", "is_correct": False},
                {"text": "B", "is_correct": False},
            ],
        },
    )
    assert response.status_code == 400
    assert "exactly one correct" in response.text.lower()


def test_image_upload_requires_positive_marks(client):
    test_client, session_factory = client
    db = session_factory()
    examiner = _create_user(db, "examiner2@example.com", role=UserRole.examiner)
    db.close()

    login_response = test_client.post(
        "/auth/login",
        data={"username": examiner.email, "password": "password"},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    response = test_client.post(
        "/questions/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "subject": "art",
            "question_type": "image_upload",
            "difficulty": "medium",
            "text": "Upload the image",
            "marks": 0,
        },
    )
    assert response.status_code == 400


def test_exam_configuration_constraints_are_enforced(client):
    test_client, session_factory = client
    db = session_factory()
    examiner = _create_user(db, "examiner4@example.com", role=UserRole.examiner)
    question = Question(
        subject="history",
        question_type=QuestionType.mcq,
        difficulty="easy",
        text="Sample question",
        marks=1,
        negative_marks=0,
        created_by=examiner.id,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    db.close()

    login_response = test_client.post(
        "/auth/login",
        data={"username": examiner.email, "password": "password"},
    )
    token = login_response.json()["access_token"]

    response = test_client.post(
        "/exams/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Bad Exam",
            "subject": "history",
            "duration_minutes": 20,
            "start_time": (datetime.utcnow() - timedelta(minutes=5)).isoformat(),
            "end_time": (datetime.utcnow() + timedelta(minutes=60)).isoformat(),
            "question_ids": [question.id],
            "question_selection_rules": {"difficulty_counts": {"hard": 1}},
        },
    )
    assert response.status_code == 400
    assert "not enough questions" in response.text.lower()


def test_randomized_paper_generation_is_deterministic_per_student_id(client):
    test_client, session_factory = client
    db = session_factory()
    examiner = _create_user(db, "examiner3@example.com", role=UserRole.examiner)
    student = _create_user(db, "student@example.com", role=UserRole.student)
    questions = [
        Question(
            subject="biology",
            question_type=QuestionType.mcq,
            difficulty="easy",
            text=f"Question {i}",
            marks=1,
            negative_marks=0,
            created_by=examiner.id,
        )
        for i in range(3)
    ]
    db.add_all(questions)
    db.commit()
    for q in questions:
        db.refresh(q)

    exam_payload = {
        "title": "Biology Exam",
        "subject": "biology",
        "duration_minutes": 30,
        "start_time": (datetime.utcnow() - timedelta(minutes=5)).isoformat(),
        "end_time": (datetime.utcnow() + timedelta(minutes=60)).isoformat(),
        "question_ids": [q.id for q in questions],
        "randomize_questions": True,
    }
    login_response = test_client.post(
        "/auth/login",
        data={"username": examiner.email, "password": "password"},
    )
    token = login_response.json()["access_token"]

    create_exam_response = test_client.post(
        "/exams/",
        headers={"Authorization": f"Bearer {token}"},
        json=exam_payload,
    )
    assert create_exam_response.status_code == 200
    exam_id = create_exam_response.json()["id"]

    student_login = test_client.post(
        "/auth/login",
        data={"username": student.email, "password": "password"},
    )
    student_token = student_login.json()["access_token"]

    start_response = test_client.post(
        f"/exams/{exam_id}/start",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert start_response.status_code == 200
    session_token = start_response.json()["access_token"]

    first_response = test_client.get(
        f"/exams/{exam_id}/questions",
        headers={"Authorization": f"Bearer {session_token}"},
    )
    assert first_response.status_code == 200
    first_ids = [item["id"] for item in first_response.json()]

    second_response = test_client.get(
        f"/exams/{exam_id}/questions",
        headers={"Authorization": f"Bearer {session_token}"},
    )
    assert second_response.status_code == 200
    second_ids = [item["id"] for item in second_response.json()]

    assert first_ids == second_ids
    db.close()
