import json
import random
from locust import HttpUser, task, between

class ExamPlatformLoadUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        """Authenticates a test candidate and fetches available exam sessions."""
        self.auth_token = None
        response = self.client.post(
            "/auth/login",
            data={"username": "student1@example.com", "password": "password123"}
        )
        if response.status_code == 200:
            self.auth_token = response.json().get("access_token")

    @task(3)
    def check_health_and_analytics(self):
        """Simulates system health monitoring and dashboard polling."""
        self.client.get("/health")
        if self.auth_token:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            self.client.get("/auth/me", headers=headers)
            self.client.get("/notifications/", headers=headers)

    @task(2)
    def fetch_my_exams(self):
        """Simulates candidate loading their scheduled exam list."""
        if self.auth_token:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            self.client.get("/exams/student/list", headers=headers)
            self.client.get("/student/mock-list", headers=headers)

    @task(1)
    def simulate_proctoring_violation_heartbeat(self):
        """Simulates sending proctoring violation alerts."""
        if self.auth_token:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            event_types = ["tab_switch", "gaze_away", "face_absent"]
            event = random.choice(event_types)
            self.client.get("/proctoring/admin/logs", headers=headers)
