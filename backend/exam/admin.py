from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Exam, QuestionPaper, StudentExam, Result, Question


# =================================================
# CUSTOM USER ADMIN
# =================================================
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Role Information', {'fields': ('role',)}),
    )

    list_display = ('username', 'email', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')


# =================================================
# EXAM ADMIN (WITH APPROVE / REJECT ACTIONS)
# =================================================
@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):

    list_display = (
        'exam_name',
        'exam_date',
        'start_time',
        'workflow_status',
        'assigned_staff',
        'created_by',
        'created_at'
    )

    list_filter = ('workflow_status', 'exam_date')
    search_fields = ('exam_name',)


    actions = ['approve_exams', 'reject_exams']

    # 🔹 Approve Action
    def approve_exams(self, request, queryset):
        queryset.update(workflow_status='APPROVED')
    approve_exams.short_description = "Approve selected exams"

    # 🔹 Reject Action
    def reject_exams(self, request, queryset):
        queryset.update(workflow_status='DRAFT')
    reject_exams.short_description = "Reject selected exams"


# =================================================
# QUESTION ADMIN
# =================================================
@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = (
        'exam',
        'question_text',
        'created_by',
        'created_at'
    )

    search_fields = ('question_text',)
    list_filter = ('exam',)


# =================================================
# QUESTION PAPER ADMIN
# =================================================
@admin.register(QuestionPaper)
class QuestionPaperAdmin(admin.ModelAdmin):
    list_display = (
        'exam',
        'uploaded_by',
        'is_locked',
        'question_hash',
        'blockchain_tx_hash',
        'uploaded_at'
    )

    list_filter = ('is_locked',)


# =================================================
# STUDENT EXAM ADMIN
# =================================================
@admin.register(StudentExam)
class StudentExamAdmin(admin.ModelAdmin):
    list_display = (
        'student',
        'exam',
        'status',
        'start_time',
        'end_time'
    )

    list_filter = ('status',)


# =================================================
# RESULT ADMIN
# =================================================
@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = (
        'student_exam',
        'score',
        'evaluated_at'
    )
