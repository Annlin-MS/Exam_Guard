from rest_framework import serializers
from .models import Exam, Question, StudentExam, Result, User

# ── EXAM ──
class ExamSerializer(serializers.ModelSerializer):
    assigned_staff_name = serializers.CharField(
        source='assigned_staff.username', read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.username', read_only=True
    )
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = [
            'id', 'exam_name', 'exam_date', 'start_time',
            'duration_minutes', 'total_questions_allowed',
            'marks_correct', 'marks_wrong', 'workflow_status',
            'assigned_staff', 'assigned_staff_name',
            'created_by', 'created_by_name',
            'question_count', 'created_at'
        ]
        read_only_fields = ['created_by', 'workflow_status']

    def get_question_count(self, obj):
        return obj.questions.count()

    def validate(self, data):
        from datetime import date
        if data.get('exam_date') and data['exam_date'] < date.today():
            raise serializers.ValidationError(
                "Exam date cannot be in the past!"
            )
        if data.get('total_questions_allowed', 0) <= 0:
            raise serializers.ValidationError(
                "Total questions must be greater than 0!"
            )
        return data


# ── QUESTION (Admin/Staff view — includes correct answer) ──
class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = [
            'id', 'exam', 'question_text',
            'option_a', 'option_b', 'option_c', 'option_d',
            'correct_option', 'created_by', 'created_at'
        ]
        read_only_fields = ['created_by']


# ── QUESTION (Student view — NO correct answer!) ──
class QuestionStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = [
            'id', 'question_text',
            'option_a', 'option_b',
            'option_c', 'option_d'
            # ❌ correct_option NOT included!
        ]


# ── STUDENT EXAM ──
class StudentExamSerializer(serializers.ModelSerializer):
    exam_name = serializers.CharField(
        source='exam.exam_name', read_only=True
    )
    student_name = serializers.CharField(
        source='student.username', read_only=True
    )

    class Meta:
        model = StudentExam
        fields = [
            'id', 'student', 'student_name',
            'exam', 'exam_name',
            'start_time', 'end_time', 'status'
        ]
        read_only_fields = ['start_time', 'end_time', 'status']


# ── RESULT ──
class ResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source='student_exam.student.username', read_only=True
    )
    exam_name = serializers.CharField(
        source='student_exam.exam.exam_name', read_only=True
    )

    class Meta:
        model = Result
        fields = [
            'id', 'student_exam', 'student_name',
            'exam_name', 'score',
            'result_hash', 'evaluated_at'
        ]
        read_only_fields = ['result_hash', 'evaluated_at']


# ── USER (safe, no password) ──
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'is_active']