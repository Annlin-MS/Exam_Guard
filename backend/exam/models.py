from django.contrib.auth.models import AbstractUser
from django.db import models


# =================================================
# USER MODEL
# =================================================
class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('STAFF', 'Staff'),
        ('STUDENT', 'Student'),
    )

    role = models.CharField(max_length=10, choices=ROLE_CHOICES)

    def __str__(self):
        return f"{self.username} ({self.role})"


# =================================================
# EXAM MODEL
# =================================================
class Exam(models.Model):

    WORKFLOW_STATUS = (
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted For Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('LOCKED', 'Locked')
    )

    exam_name = models.CharField(max_length=200)
    exam_date = models.DateField()
    start_time = models.TimeField()
    duration_minutes = models.IntegerField()
    total_questions_allowed = models.IntegerField(default=10)

    marks_correct = models.IntegerField(default=4)
    marks_wrong = models.IntegerField(default=-1)

    workflow_status = models.CharField(
        max_length=20,
        choices=WORKFLOW_STATUS,
        default='DRAFT',
        db_index=True
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'ADMIN'}
    )

    assigned_staff = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_exams',
        limit_choices_to={'role': 'STAFF'}
    )
    enrolled_students = models.ManyToManyField(
    User,
    related_name='enrolled_exams',
    blank=True,
    limit_choices_to={'role': 'STUDENT'}
)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.exam_name



# =================================================
# QUESTION MODEL (MCQs)
# =================================================
class Question(models.Model):
    exam = models.ForeignKey(
        Exam,
        related_name='questions',
        on_delete=models.CASCADE
    )

    question_text = models.TextField()

    option_a = models.CharField(max_length=255)
    option_b = models.CharField(max_length=255)
    option_c = models.CharField(max_length=255)
    option_d = models.CharField(max_length=255)

    correct_option = models.CharField(
        max_length=1,
        choices=(
            ('A', 'Option A'),
            ('B', 'Option B'),
            ('C', 'Option C'),
            ('D', 'Option D'),
        )
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'STAFF'}
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.exam.exam_name} - {self.question_text[:40]}"
    
    def save(self, *args, **kwargs):
     if self.exam.workflow_status == 'LOCKED':
        raise ValueError("Cannot modify questions after exam is locked")
     super().save(*args, **kwargs)


# =================================================
# QUESTION PAPER MODEL (LOCKED + BLOCKCHAIN)
# =================================================
class QuestionPaper(models.Model):
    exam = models.OneToOneField(
        Exam,
        on_delete=models.CASCADE
    )

    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'STAFF'}
    )

    # 🔐 Integrity fields
    question_hash = models.CharField(max_length=64, blank=True)
    ipfs_cid = models.CharField(max_length=255, blank=True, null=True)
    blockchain_tx_hash = models.CharField(max_length=255, blank=True, null=True)

    # 🔒 Lock flag
    is_locked = models.BooleanField(default=False)

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Question Paper for {self.exam.exam_name}"


# =================================================
# STUDENT EXAM MODEL
# =================================================
class StudentExam(models.Model):
    STATUS_CHOICES = (
        ('STARTED', 'Started'),
        ('SUBMITTED', 'Submitted'),
    )

    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'STUDENT'}
    )

    exam = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name='student_attempts'
    )

    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='STARTED'
    )

    class Meta:
        unique_together = ('student', 'exam')

    def __str__(self):
        return f"{self.student.username} - {self.exam.exam_name}"


# =================================================
# RESULT MODEL
# =================================================
class Result(models.Model):
    student_exam = models.OneToOneField(
        StudentExam,
        on_delete=models.CASCADE
    )

    score = models.IntegerField()
    result_hash = models.CharField(max_length=255)

    evaluated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Result: {self.student_exam}"

class AuditLog(models.Model):

    ACTION_TYPES = (
        ('CREATE_EXAM', 'Create Exam'),
        ('APPROVE_EXAM', 'Approve Exam'),
        ('LOCK_PAPER', 'Lock Question Paper'),
        ('ENROLL_STUDENT', 'Enroll Student'),
        ('SUBMIT_EXAM', 'Submit Exam'),
        ('COMMIT_RESULT', 'Commit Result'),
    )

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.action_type}"
    
    
    