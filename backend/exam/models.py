from django.contrib.auth.models import AbstractUser
from django.db import models


# =================================================
# USER MODEL
# =================================================
class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN',   'Admin'),
        ('STAFF',   'Staff'),
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
        ('DRAFT',     'Draft'),
        ('SUBMITTED', 'Submitted For Approval'),
        ('APPROVED',  'Approved'),
        ('REJECTED',  'Rejected'),
        ('LOCKED',    'Locked'),
    )

    DEPARTMENT_CHOICES = (
        ('CS',    'Computer Science'),
        ('ECE',   'Electronics'),
        ('MECH',  'Mechanical'),
        ('CIVIL', 'Civil'),
        ('MBA',   'MBA'),
        ('ALL',   'All Departments'),
    )

    exam_name               = models.CharField(max_length=200)
    exam_date               = models.DateField()
    start_time              = models.TimeField()
    duration_minutes        = models.IntegerField()
    total_questions_allowed = models.IntegerField(default=10)
    marks_correct           = models.IntegerField(default=4)
    marks_wrong             = models.IntegerField(default=-1)

    department = models.CharField(
        max_length=20,
        choices=DEPARTMENT_CHOICES,
        default='ALL'
    )
    semester = models.CharField(
        max_length=2,
        blank=True,
        null=True
    )

    workflow_status = models.CharField(
        max_length=20,
        choices=WORKFLOW_STATUS,
        default='DRAFT',
        db_index=True
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_exams',
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

    STATUS_CHOICES = (
        ('PENDING',  'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )

    OPTION_CHOICES = (
        ('A', 'Option A'),
        ('B', 'Option B'),
        ('C', 'Option C'),
        ('D', 'Option D'),
    )

    exam = models.ForeignKey(
        Exam,
        related_name='questions',
        on_delete=models.CASCADE
    )

    question_text  = models.TextField()
    option_a       = models.CharField(max_length=255)
    option_b       = models.CharField(max_length=255)
    option_c       = models.CharField(max_length=255)
    option_d       = models.CharField(max_length=255)
    correct_option = models.CharField(max_length=1, choices=OPTION_CHOICES)

    status           = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    rejection_reason = models.TextField(blank=True, null=True)

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_questions',
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
        on_delete=models.CASCADE,
        related_name='question_paper'
    )

    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='uploaded_papers',
        limit_choices_to={'role': 'STAFF'}
    )

    question_hash      = models.CharField(max_length=64, blank=True)
    ipfs_cid           = models.CharField(max_length=255, blank=True, null=True)
    blockchain_tx_hash = models.CharField(max_length=255, blank=True, null=True)
    is_locked          = models.BooleanField(default=False)
    uploaded_at        = models.DateTimeField(auto_now_add=True)
    locked_at          = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Question Paper for {self.exam.exam_name}"


# =================================================
# STUDENT EXAM MODEL
# =================================================
class StudentExam(models.Model):

    STATUS_CHOICES = (
        ('STARTED',   'Started'),
        ('SUBMITTED', 'Submitted'),
    )

    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='student_exams',
        limit_choices_to={'role': 'STUDENT'}
    )

    exam = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name='student_attempts'
    )

    status       = models.CharField(max_length=10, choices=STATUS_CHOICES, default='STARTED')
    start_time   = models.DateTimeField(auto_now_add=True)
    end_time     = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('student', 'exam')

    def __str__(self):
        return f"{self.student.username} - {self.exam.exam_name}"


# =================================================
# STUDENT ANSWER MODEL
# =================================================
class StudentAnswer(models.Model):

    OPTION_CHOICES = (
        ('A', 'Option A'),
        ('B', 'Option B'),
        ('C', 'Option C'),
        ('D', 'Option D'),
    )

    student_exam = models.ForeignKey(
        StudentExam,
        on_delete=models.CASCADE,
        related_name='answers'
    )

    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='student_answers'
    )

    selected_option = models.CharField(
        max_length=1,
        choices=OPTION_CHOICES,
        null=True,
        blank=True  # null means skipped
    )

    is_correct = models.BooleanField(default=False)

    class Meta:
        unique_together = ('student_exam', 'question')

    def __str__(self):
        return f"{self.student_exam.student.username} - Q{self.question.id} - {self.selected_option}"


# =================================================
# RESULT MODEL
# =================================================
class Result(models.Model):

    student_exam    = models.OneToOneField(StudentExam, on_delete=models.CASCADE, related_name='result')
    score           = models.FloatField(default=0)
    total_marks     = models.FloatField(default=0)
    percentage      = models.FloatField(default=0)
    correct_count   = models.IntegerField(default=0)
    total_questions = models.IntegerField(default=0)
    result_hash     = models.CharField(max_length=255, blank=True, null=True)
    is_published    = models.BooleanField(default=False)
    evaluated_at    = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Result: {self.student_exam.student.username} - {self.student_exam.exam.exam_name}"


# =================================================
# AUDIT LOG MODEL
# =================================================
class AuditLog(models.Model):

    ACTION_TYPES = (
        ('CREATE_EXAM',    'Create Exam'),
        ('UPDATE_EXAM',    'Update Exam'),
        ('APPROVE_EXAM',   'Approve Exam'),
        ('REJECT_EXAM',    'Reject Exam'),
        ('LOCK_PAPER',     'Lock Question Paper'),
        ('ENROLL_STUDENT', 'Enroll Student'),
        ('SUBMIT_EXAM',    'Submit Exam'),
        ('COMMIT_RESULT',  'Commit Result'),
        ('ADD_QUESTION',   'Add Question'),
        ('PUBLISH_RESULT', 'Publish Result'),
    )

    user        = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    description = models.TextField()
    timestamp   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user} - {self.action_type} - {self.timestamp}"


# =================================================
# STUDENT PROFILE MODEL
# =================================================
class StudentProfile(models.Model):

    DEPARTMENT_CHOICES = (
        ('CS',    'Computer Science'),
        ('ECE',   'Electronics'),
        ('MECH',  'Mechanical'),
        ('CIVIL', 'Civil'),
        ('MBA',   'MBA'),
    )

    SEMESTER_CHOICES = (
        ('1', 'Semester 1'),
        ('2', 'Semester 2'),
        ('3', 'Semester 3'),
        ('4', 'Semester 4'),
        ('5', 'Semester 5'),
        ('6', 'Semester 6'),
        ('7', 'Semester 7'),
        ('8', 'Semester 8'),
    )

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    department  = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES, default='CS')
    semester    = models.CharField(max_length=2, choices=SEMESTER_CHOICES, blank=True, null=True)
    roll_number = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.department} S{self.semester}"