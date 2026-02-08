from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User
from .models import Question


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Role Information', {'fields': ('role',)}),
    )

from .models import Exam

@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ('exam_name', 'exam_date', 'start_time', 'status')

from .models import QuestionPaper

@admin.register(QuestionPaper)
class QuestionPaperAdmin(admin.ModelAdmin):
    list_display = ('exam', 'uploaded_by', 'uploaded_at')

from .models import StudentExam, Result

@admin.register(StudentExam)
class StudentExamAdmin(admin.ModelAdmin):
    list_display = ('student', 'exam', 'status', 'start_time')

@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = ('student_exam', 'score', 'evaluated_at')

admin.site.register(Question)