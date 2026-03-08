from datetime import datetime, timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.response import Response
from rest_framework.views import APIView

import json
import hashlib

from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from django.utils import timezone

from cryptography.fernet import Fernet

from .models import (
    Exam,
    QuestionPaper,
    StudentExam,
    Result,
    Question,
    AuditLog,
    StudentAnswer,
    StudentProfile,
)

from .blockchain import contract, web3

User = get_user_model()

def create_audit_log(user, action_type, description):
    AuditLog.objects.create(
        user=user,
        action_type=action_type,
        description=description
    )

# -------------------------------------------------
# API 1: START EXAM (Student)
# -------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_exam(request, exam_id):
    user = request.user
    if user.role != 'STUDENT':
        return Response({'error': 'Only students can start exams'}, status=403)
    try:
        exam = Exam.objects.get(id=exam_id)
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)

    exam_start = timezone.make_aware(
        datetime.combine(exam.exam_date, exam.start_time)
    )
    exam_end = exam_start + timedelta(minutes=exam.duration_minutes)
    now = timezone.now()

    if now < exam_start:
        return Response({'error': 'Exam has not started yet'}, status=403)
    if now > exam_end:
        return Response({'error': 'Exam time is over'}, status=403)
    if not exam.enrolled_students.filter(id=user.id).exists():
        return Response({'error': 'You are not enrolled in this exam'}, status=403)

    student_exam, created = StudentExam.objects.get_or_create(
        student=user,
        exam=exam,
        defaults={'status': 'STARTED'}
    )

    if student_exam.status == 'SUBMITTED':
        return Response({'error': 'Exam already submitted'}, status=403)

    return Response({'message': 'Exam started successfully'})


# -------------------------------------------------
# API 2: FETCH QUESTION PAPER (Student)
# -------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def fetch_question_paper(request, exam_id):
    user = request.user

    if user.role != 'STUDENT':
        return Response({'error': 'Only students can access question papers'}, status=403)

    try:
        exam = Exam.objects.get(id=exam_id)
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)

    try:
        qp = QuestionPaper.objects.get(exam=exam)
    except QuestionPaper.DoesNotExist:
        return Response({'error': 'Question paper not uploaded'}, status=404)

    questions_qs = exam.questions.filter(status='APPROVED')
    questions = [{
        'id': q.id,
        'question_text': q.question_text,
        'option_a': q.option_a,
        'option_b': q.option_b,
        'option_c': q.option_c,
        'option_d': q.option_d,
    } for q in questions_qs]

    return Response({
        'exam': exam.exam_name,
        'exam_id': exam.id,
        'exam_date': str(exam.exam_date),
        'start_time': str(exam.start_time),
        'duration_minutes': exam.duration_minutes,
        'questions': questions,
        'total_questions': len(questions),
    })


# -------------------------------------------------
# API 3: SUBMIT EXAM (Student)
# -------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_exam(request, exam_id):
    user = request.user
    if user.role != 'STUDENT':
        return Response({'error': 'Only students can submit exams'}, status=403)

    try:
        student_exam = StudentExam.objects.get(student=user, exam_id=exam_id)
    except StudentExam.DoesNotExist:
        return Response({'error': 'Exam not started'}, status=404)

    if student_exam.status == 'SUBMITTED':
        try:
            result = Result.objects.get(student_exam=student_exam)
            return Response({
                'message':    'Already submitted',
                'score':      result.score,
                'result_id':  result.id,
                'percentage': result.percentage,
            })
        except Result.DoesNotExist:
            pass

    exam         = student_exam.exam
    answers_data = request.data.get('answers', [])

    StudentAnswer.objects.filter(student_exam=student_exam).delete()

    score         = 0
    correct_count = 0

    for ans in answers_data:
        question_id     = ans.get('question_id')
        selected_option = ans.get('selected_option')
        try:
            question   = Question.objects.get(id=question_id, exam=exam)
            is_correct = (selected_option == question.correct_option)

            StudentAnswer.objects.create(
                student_exam    = student_exam,
                question        = question,
                selected_option = selected_option if selected_option else None,
                is_correct      = is_correct,
            )

            if selected_option:
                if is_correct:
                    score += exam.marks_correct
                    correct_count += 1
                else:
                    score += exam.marks_wrong
        except Question.DoesNotExist:
            continue

    score       = max(0, score)
    total_marks = exam.total_questions_allowed * exam.marks_correct
    percentage  = round((score / total_marks) * 100, 1) if total_marks > 0 else 0

    student_exam.status       = 'SUBMITTED'
    student_exam.submitted_at = timezone.now()
    student_exam.end_time     = timezone.now()
    student_exam.save()

    result_string = f"{exam.id}|{user.id}|{score}|{student_exam.end_time.isoformat()}"
    result_hash   = hashlib.sha256(result_string.encode()).hexdigest()

    student_hash = hashlib.sha256(str(user.id).encode()).hexdigest()
    try:
        tx_hash = contract.functions.commitResult(
            exam.id,
            web3.to_bytes(hexstr="0x" + student_hash),
            web3.to_bytes(hexstr="0x" + result_hash)
        ).transact()
        tx_hash_hex = tx_hash.hex()
    except Exception as e:
        tx_hash_hex = ''

    result, _ = Result.objects.update_or_create(
        student_exam = student_exam,
        defaults = {
            'score':           score,
            'total_marks':     total_marks,
            'percentage':      percentage,
            'correct_count':   correct_count,
            'total_questions': exam.questions.filter(status='APPROVED').count(),
            'result_hash':     result_hash,
            'is_published':    False,
        }
    )

    create_audit_log(
        request.user,
        'SUBMIT_EXAM',
        f"Submitted exam: {exam.exam_name} | Score: {score}/{total_marks}"
    )

    return Response({
        'message':            'Exam submitted successfully!',
        'score':              score,
        'total_marks':        total_marks,
        'percentage':         percentage,
        'result_id':          result.id,
        'blockchain_tx_hash': tx_hash_hex,
    })


# -------------------------------------------------
# API 4: CREATE QUESTION PAPER (Staff)
# -------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_question_paper(request):
    user = request.user

    if user.role != 'STAFF':
        return Response({'error': 'Only staff can upload question papers'}, status=403)

    exam_id = request.data.get('exam_id')

    try:
        exam = Exam.objects.get(id=exam_id)
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)

    QuestionPaper.objects.get_or_create(
        exam=exam,
        uploaded_by=user,
        defaults={
            'ipfs_cid': 'temp',
            'blockchain_tx_hash': 'temp'
        }
    )

    return Response({'message': 'Question paper record created'})


# -------------------------------------------------
# API 5: LOCK QUESTION PAPER (Staff + Blockchain)
# -------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def lock_question_paper(request, exam_id):
    print(">>> LOCK API HIT <<<")
    user = request.user

    if user.role != 'STAFF':
        return Response({'error': 'Only staff can lock question paper'}, status=403)

    try:
        exam = Exam.objects.get(id=exam_id)
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)

    if exam.assigned_staff_id != user.id:
        return Response({'error': 'Not assigned to this exam'}, status=403)

    if exam.workflow_status != 'APPROVED':
        return Response({'error': 'Exam not approved by admin'}, status=400)

    qp, created = QuestionPaper.objects.get_or_create(
        exam=exam,
        defaults={
            'uploaded_by': user,
            'question_hash': '',
            'is_locked': False
        }
    )

    if qp.is_locked:
        return Response({'error': 'Question paper already locked'}, status=400)

    questions = exam.questions.all().order_by('id')

    if questions.count() != exam.total_questions_allowed:
        return Response({
            'error': f'Exam requires {exam.total_questions_allowed} questions. '
                     f'Currently added: {questions.count()}'
        }, status=400)

    if not questions.exists():
        return Response({'error': 'No questions found for this exam'}, status=400)

    payload = []
    for q in questions:
        payload.append({
            'id': q.id,
            'question': q.question_text,
            'options': {
                'A': q.option_a,
                'B': q.option_b,
                'C': q.option_c,
                'D': q.option_d,
            },
            'correct': q.correct_option
        })

    payload_json  = json.dumps(payload, sort_keys=True)
    question_hash = hashlib.sha256(payload_json.encode()).hexdigest()
    qp.question_hash = question_hash

    start_ts = int(
        timezone.make_aware(
            timezone.datetime.combine(exam.exam_date, exam.start_time)
        ).timestamp()
    )
    end_ts = start_ts + exam.duration_minutes * 60

    try:
        tx_hash = contract.functions.registerExam(
            exam.id,
            web3.to_bytes(hexstr="0x" + question_hash),
            start_ts,
            end_ts
        ).transact()
    except Exception as e:
        return Response({'error': str(e)}, status=500)

    qp.blockchain_tx_hash = tx_hash.hex()
    qp.is_locked          = True
    qp.locked_at          = timezone.now()
    qp.save()

    exam.workflow_status = 'LOCKED'
    exam.save()

    create_audit_log(
        request.user,
        'LOCK_PAPER',
        f"Locked question paper for {exam.exam_name}"
    )

    return Response({
        'message':            'Question paper locked successfully',
        'blockchain_tx_hash': qp.blockchain_tx_hash
    })


# -------------------------------------------------
# VERIFY QUESTION PAPER
# -------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_question_paper(request, exam_id):
    user = request.user

    if user.role != 'ADMIN':
        return Response({'error': 'Only admin can verify question paper'}, status=403)

    try:
        exam = Exam.objects.get(id=exam_id)
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)

    try:
        qp = QuestionPaper.objects.get(exam=exam)
    except QuestionPaper.DoesNotExist:
        return Response({'error': 'Question paper not found'}, status=404)

    questions    = exam.questions.all().order_by('id')
    payload      = []
    for q in questions:
        payload.append({
            'id': q.id,
            'question': q.question_text,
            'options': {'A': q.option_a, 'B': q.option_b, 'C': q.option_c, 'D': q.option_d},
            'correct': q.correct_option
        })

    payload_json = json.dumps(payload, sort_keys=True)
    local_hash   = hashlib.sha256(payload_json.encode()).hexdigest()

    if local_hash == qp.question_hash:
        return Response({'status': 'VERIFIED', 'message': 'Question paper integrity verified. No tampering detected.'})
    else:
        return Response({'status': 'TAMPERED', 'message': 'Mismatch detected! Question paper may have been altered.'})


# -------------------------------------------------
# VERIFY RESULT
# -------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_result(request, exam_id, student_id):
    user = request.user

    if user.role == 'ADMIN':
        pass
    elif user.role == 'STUDENT' and user.id == student_id:
        pass
    else:
        return Response({'error': 'Not allowed'}, status=403)

    try:
        student_exam = StudentExam.objects.get(exam_id=exam_id, student_id=student_id)
    except StudentExam.DoesNotExist:
        return Response({'error': 'Result not found'}, status=404)

    try:
        result = Result.objects.get(student_exam=student_exam)
    except Result.DoesNotExist:
        return Response({'error': 'Result record missing'}, status=404)

    result_string = f"{exam_id}|{student_id}|{result.score}|{student_exam.end_time.isoformat()}"
    local_hash    = hashlib.sha256(result_string.encode()).hexdigest()
    student_hash  = hashlib.sha256(str(student_id).encode()).hexdigest()

    try:
        blockchain_hash     = contract.functions.getResult(exam_id, bytes.fromhex(student_hash)).call()
        blockchain_hash_hex = blockchain_hash.hex()
    except Exception as e:
        return Response({"blockchain_error": str(e)}, status=500)

    return Response({
        "local_hash":              local_hash,
        "local_hash_length":       len(local_hash),
        "student_hash":            student_hash,
        "blockchain_hash":         blockchain_hash_hex,
        "blockchain_hash_length":  len(blockchain_hash_hex)
    })


# -------------------------------------------------
# LIST EXAMS
# -------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_exams(request):
    user = request.user
    now  = timezone.localtime()

    if user.role == 'STUDENT':
        exams = user.enrolled_exams.filter(workflow_status='LOCKED')
    elif user.role == 'STAFF':
        exams = Exam.objects.filter(assigned_staff=user)
    else:
        exams = Exam.objects.all()

    exam_list = []

    for exam in exams:
        start_datetime = timezone.make_aware(
            timezone.datetime.combine(exam.exam_date, exam.start_time)
        )
        end_datetime = start_datetime + timezone.timedelta(minutes=exam.duration_minutes)

        student_exam = StudentExam.objects.filter(student=user, exam=exam).first()

        if student_exam and student_exam.status == "SUBMITTED":
            status = "SUBMITTED"
        elif now > end_datetime:
            status = "MISSED"
        elif start_datetime <= now <= end_datetime:
            status = "ONGOING"
        else:
            status = "UPCOMING"

        exam_list.append({
            "id":                      exam.id,
            "exam_name":               exam.exam_name,
            "exam_date":               str(exam.exam_date),
            "start_time":              str(exam.start_time),
            "end_time":                str(end_datetime.time()),
            "duration":                exam.duration_minutes,
            "duration_minutes":        exam.duration_minutes,
            "status":                  status,
            "workflow_status":         exam.workflow_status,
            "total_questions_allowed": exam.total_questions_allowed,
            "assigned_staff":          exam.assigned_staff.username if exam.assigned_staff else None,
            "marks_correct":           exam.marks_correct,
            "marks_wrong":             exam.marks_wrong,
            "department":              exam.department,
            "semester":                exam.semester,
            "enrolled_students_count": exam.enrolled_students.count(),
        })

    return Response(exam_list)


# -------------------------------------------------
# LOGIN
# -------------------------------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get("username")
    password = request.data.get("password")
    user     = authenticate(username=username, password=password)
    if user is None:
        return Response({"error": "Invalid credentials"}, status=400)
    token, created = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "role": user.role, "username": user.username})


# -------------------------------------------------
# SUBMIT FOR APPROVAL
# -------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_for_approval(request, exam_id):
    if request.user.role != 'STAFF':
        return Response({'error': 'Only staff allowed'}, status=403)
    try:
        exam = Exam.objects.get(id=exam_id, assigned_staff=request.user)

        if exam.workflow_status not in ['DRAFT', 'REJECTED']:
            return Response({'error': f'Cannot submit — status is {exam.workflow_status}'}, status=400)

        rejected_count = exam.questions.filter(status='REJECTED').count()
        if rejected_count > 0:
            return Response({'error': f'Please delete {rejected_count} rejected question(s) first!'}, status=400)

        # ✅ Count only active (non-rejected) questions
        active_count = exam.questions.exclude(status='REJECTED').count()
        if active_count < exam.total_questions_allowed:
            return Response({
                'error': f'Need {exam.total_questions_allowed} questions. Have {active_count} active.'
            }, status=400)

        exam.questions.filter(status='APPROVED').update(status='PENDING')
        exam.workflow_status = 'SUBMITTED'
        exam.save()

        AuditLog.objects.create(
            user=request.user,
            action_type='SUBMIT_APPROVAL',
            description=f"Submitted exam for approval: {exam.exam_name}"
        )

        return Response({'message': 'Submitted for approval successfully!'})

    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)


# -------------------------------------------------
# APPROVE EXAM
# -------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_exam(request, exam_id):
    user = request.user
    if user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    try:
        exam = Exam.objects.get(id=exam_id)
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)

    if exam.workflow_status != 'SUBMITTED':
        return Response({'error': 'Exam not submitted yet'}, status=400)

    exam.workflow_status = 'APPROVED'
    exam.save()

    create_audit_log(request.user, 'APPROVE_EXAM', f"Approved exam: {exam.exam_name}")
    return Response({'message': 'Exam approved successfully'})


# -------------------------------------------------
# REJECT EXAM
# -------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_exam(request, exam_id):
    user = request.user
    if user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    try:
        exam = Exam.objects.get(id=exam_id)
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)

    if exam.workflow_status != 'SUBMITTED':
        return Response({'error': 'Exam not submitted yet'}, status=400)

    exam.workflow_status = 'DRAFT'
    exam.save()
    return Response({'message': 'Exam rejected and returned to staff'})


# -------------------------------------------------
# LIST STAFF
# -------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_staff(request):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    staff = User.objects.filter(role='STAFF')
    data  = [{'id': s.id, 'username': s.username, 'email': s.email, 'is_active': s.is_active} for s in staff]
    return Response(data)


# -------------------------------------------------
# ADMIN DASHBOARD STATS
# -------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)

    return Response({
        "total_exams":        Exam.objects.count(),
        "active_exams":       Exam.objects.filter(workflow_status='LOCKED').count(),
        "total_staff":        User.objects.filter(role='STAFF').count(),
        "total_students":     User.objects.filter(role='STUDENT').count(),
        "pending_approvals":  Exam.objects.filter(workflow_status='SUBMITTED').count(),
    })


# -------------------------------------------------
# VIEW AUDIT LOGS
# -------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def view_audit_logs(request):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    logs = AuditLog.objects.all().order_by('-timestamp')[:50]
    data = [{
        "user":        log.user.username if log.user else "System",
        "action":      log.action_type,
        "description": log.description,
        "timestamp":   log.timestamp
    } for log in logs]
    return Response(data)


# -------------------------------------------------
# CREATE QUESTION
# -------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_question(request, exam_id):
    user = request.user
    if user.role != 'STAFF':
        return Response({'error': 'Only staff allowed'}, status=403)
    try:
        exam = Exam.objects.get(id=exam_id)
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)

    # ✅ Exclude rejected — they are being replaced
    active_count = Question.objects.filter(exam=exam).exclude(status='REJECTED').count()

    if active_count >= exam.total_questions_allowed:
        return Response({
            'error': f'Question limit reached! This exam allows only {exam.total_questions_allowed} questions.'
        }, status=400)

    Question.objects.create(
        exam=exam,
        question_text=request.data.get('question_text'),
        option_a=request.data.get('option_a'),
        option_b=request.data.get('option_b'),
        option_c=request.data.get('option_c'),
        option_d=request.data.get('option_d'),
        correct_option=request.data.get('correct_option'),
        created_by=user,
        status='PENDING',
        rejection_reason='',
    )
    create_audit_log(request.user, 'ADD_QUESTION', f"Added question to exam: {exam.exam_name}")
    return Response({'message': 'Question created successfully'})


# -------------------------------------------------
# BLOCKCHAIN STATUS
# -------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def blockchain_status(request):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    try:
        return Response({
            "connected":     web3.is_connected(),
            "current_block": web3.eth.block_number,
            "admin_account": web3.eth.default_account
        })
    except Exception as e:
        return Response({"connected": False, "error": str(e)}, status=500)


# -------------------------------------------------
# CREATE EXAM
# -------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_exam(request):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    try:
        assigned_staff_id = request.data.get('assigned_staff')
        assigned_staff = User.objects.get(id=assigned_staff_id, role='STAFF') if assigned_staff_id else None

        department = request.data.get('department', 'ALL')
        semester   = request.data.get('semester', None)

        exam = Exam.objects.create(
            exam_name               = request.data.get('exam_name'),
            exam_date               = request.data.get('exam_date'),
            start_time              = request.data.get('start_time'),
            duration_minutes        = request.data.get('duration_minutes'),
            total_questions_allowed = request.data.get('total_questions_allowed', 10),
            marks_correct           = request.data.get('marks_correct', 4),
            marks_wrong             = request.data.get('marks_wrong', -1),
            created_by              = request.user,
            assigned_staff          = assigned_staff,
            department              = department,
            semester                = semester,
        )

        if department == 'ALL':
            students = User.objects.filter(role='STUDENT', is_active=True)
        else:
            students = User.objects.filter(role='STUDENT', is_active=True, profile__department=department)
            if semester:
                students = students.filter(profile__semester=semester)

        exam.enrolled_students.set(students)

        AuditLog.objects.create(
            user=request.user,
            action_type='CREATE_EXAM',
            description=f"Created exam: {exam.exam_name} for {department} Sem {semester or 'All'}"
        )

        return Response({
            'message':        'Exam created successfully!',
            'exam_id':        exam.id,
            'enrolled_count': students.count(),
            'department':     department,
            'semester':       semester,
        })
    except Exception as e:
        return Response({'error': str(e)}, status=400)


# -------------------------------------------------
# LIST QUESTIONS
# -------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_questions(request, exam_id):
    try:
        exam      = Exam.objects.get(id=exam_id)
        questions = Question.objects.filter(exam=exam)
        data = [{
            'id':               q.id,
            'question_text':    q.question_text,
            'option_a':         q.option_a,
            'option_b':         q.option_b,
            'option_c':         q.option_c,
            'option_d':         q.option_d,
            'correct_option':   q.correct_option,
            'status':           q.status,
            'rejection_reason': q.rejection_reason or '',
        } for q in questions]
        return Response(data)
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)


# -------------------------------------------------
# TOGGLE USER
# -------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_user(request, user_id):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    user            = User.objects.get(id=user_id)
    user.is_active  = not user.is_active
    user.save()
    return Response({'message': 'Updated', 'is_active': user.is_active})


# -------------------------------------------------
# CHANGE PASSWORD
# -------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user     = request.user
    current  = request.data.get('current_password')
    new_pass = request.data.get('new_password')
    if not user.check_password(current):
        return Response({'error': 'Current password is wrong!'}, status=400)
    user.set_password(new_pass)
    user.save()
    return Response({'message': 'Password changed successfully!'})


# -------------------------------------------------
# LIST PENDING QUESTIONS (Admin sees all questions)
# -------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_pending_questions(request):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)

    questions = Question.objects.all().select_related('exam', 'created_by')
    data = [{
        'id':            q.id,
        'question_text': q.question_text,
        'option_a':      q.option_a,
        'option_b':      q.option_b,
        'option_c':      q.option_c,
        'option_d':      q.option_d,
        'correct_option':q.correct_option,
        'exam_id':       q.exam.id,
        'exam_name':     q.exam.exam_name,
        'created_by':    q.created_by.username,
        'status':        q.status,
    } for q in questions]
    return Response(data)


# -------------------------------------------------
# APPROVE QUESTION
# -------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_question(request, question_id):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    try:
        question                  = Question.objects.get(id=question_id)
        question.status           = 'APPROVED'
        question.rejection_reason = ''
        question.save()
        return Response({'message': 'Question approved!'})
    except Question.DoesNotExist:
        return Response({'error': 'Question not found'}, status=404)


# -------------------------------------------------
# REJECT QUESTION
# -------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_question(request, question_id):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    try:
        question                  = Question.objects.get(id=question_id)
        question.status           = 'REJECTED'
        question.rejection_reason = request.data.get('reason', 'No reason provided')
        question.save()
        return Response({'message': 'Question rejected!'})
    except Question.DoesNotExist:
        return Response({'error': 'Question not found'}, status=404)


# -------------------------------------------------
# STAFF EXAM RESULTS
# ✅ Fixed — allow both STAFF and ADMIN to call this
# -------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def staff_exam_results(request, exam_id):
    # ✅ Both staff and admin can view results
    if request.user.role not in ['STAFF', 'ADMIN']:
        return Response({'error': 'Not allowed'}, status=403)

    try:
        exam = Exam.objects.get(id=exam_id)
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)

    student_exams = StudentExam.objects.filter(
        exam=exam, status='SUBMITTED'
    ).select_related('student', 'student__profile')

    data = []
    for se in student_exams:
        profile = getattr(se.student, 'profile', None)
        try:
            result      = Result.objects.get(student_exam=se)
            total_marks = result.total_marks or (exam.total_questions_allowed * exam.marks_correct)
            percentage  = result.percentage or (
                round((result.score / total_marks) * 100, 1) if total_marks > 0 else 0
            )
            data.append({
                'student_name': se.student.username,
                'roll_number':  profile.roll_number if profile else '—',
                'score':        result.score,
                'total_marks':  total_marks,
                'percentage':   percentage,
                'result_hash':  result.result_hash,
                'submitted_at': se.end_time,
                'is_published': result.is_published,
            })
        except Result.DoesNotExist:
            pass

    # Sort by percentage descending
    data.sort(key=lambda x: x['percentage'], reverse=True)
    return Response(data)


# -------------------------------------------------
# PUBLISH RESULTS
# -------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def publish_results(request, exam_id):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    try:
        exam = Exam.objects.get(id=exam_id)
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)

    student_exams = StudentExam.objects.filter(exam=exam, status='SUBMITTED')
    published     = 0

    for se in student_exams:
        try:
            result = Result.objects.get(student_exam=se)
        except Result.DoesNotExist:
            answers     = StudentAnswer.objects.filter(student_exam=se)
            score       = 0
            correct     = 0
            for sa in answers:
                if sa.is_correct:
                    score += exam.marks_correct
                    correct += 1
                elif sa.selected_option:
                    score += exam.marks_wrong
            score       = max(0, score)
            total_marks = exam.total_questions_allowed * exam.marks_correct
            percentage  = round((score / total_marks) * 100, 1) if total_marks > 0 else 0
            s           = f"{exam.id}|{se.student.id}|{score}|{se.end_time.isoformat() if se.end_time else ''}"
            result      = Result.objects.create(
                student_exam    = se,
                score           = score,
                total_marks     = total_marks,
                percentage      = percentage,
                correct_count   = correct,
                total_questions = exam.questions.filter(status='APPROVED').count(),
                result_hash     = hashlib.sha256(s.encode()).hexdigest(),
                is_published    = False,
            )

        if not result.result_hash:
            s                  = f"{exam.id}|{se.student.id}|{result.score}|{se.end_time.isoformat() if se.end_time else ''}"
            result.result_hash = hashlib.sha256(s.encode()).hexdigest()

        if not result.is_published:
            result.is_published = True
            published += 1
        result.save()

    AuditLog.objects.create(
        user=request.user,
        action_type='PUBLISH_RESULT',
        description=f"Published all results for exam: {exam.exam_name} ({published} students)"
    )

    return Response({
        'message':   f'Results published for {published} student(s)! 🎉',
        'published': published,
    })


# -------------------------------------------------
# VERIFY RESULT HASH
# -------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_result_hash(request, exam_id):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    try:
        exam          = Exam.objects.get(id=exam_id)
        student_exams = StudentExam.objects.filter(exam=exam, status='SUBMITTED').select_related('student')
        results       = []

        for se in student_exams:
            try:
                result        = Result.objects.get(student_exam=se)
                # ✅ Use same format as submit_exam
                data_str      = f"{exam.id}|{se.student.id}|{result.score}|{se.end_time.isoformat() if se.end_time else ''}"
                recomputed    = hashlib.sha256(data_str.encode()).hexdigest()
                db_match      = recomputed == result.result_hash

                # ✅ Fetch from Ganache
                student_hash  = hashlib.sha256(str(se.student.id).encode()).hexdigest()
                chain_hash    = ''
                chain_match   = False
                try:
                    raw         = contract.functions.getResult(exam.id, bytes.fromhex(student_hash)).call()
                    chain_hash  = raw.hex()
                    chain_match = (chain_hash == result.result_hash)
                except Exception as e:
                    chain_hash = f"Blockchain error: {str(e)}"

                results.append({
                    'student':       se.student.username,
                    'roll_number':   getattr(getattr(se.student, 'profile', None), 'roll_number', '—'),
                    'score':         result.score,
                    'total_marks':   result.total_marks,
                    'percentage':    result.percentage,
                    'stored_hash':   result.result_hash,
                    'recomputed_hash': recomputed,
                    'chain_hash':    chain_hash,
                    'db_match':      db_match,       # DB hash == recomputed hash
                    'chain_match':   chain_match,    # DB hash == blockchain hash
                    'tampered':      not (db_match and chain_match),
                    'is_published':  result.is_published,
                })
            except Result.DoesNotExist:
                results.append({
                    'student': se.student.username,
                    'error':   'No result found',
                    'tampered': None,
                })

        return Response({
            'exam':       exam.exam_name,
            'department': exam.department,
            'semester':   exam.semester,
            'results':    results,
            'all_valid':  all(r.get('tampered') == False for r in results if 'tampered' in r and r['tampered'] is not None),
        })
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)


# -------------------------------------------------
# ADMIN LIST RESULTS
# -------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_list_results(request):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    exams = Exam.objects.filter(workflow_status='LOCKED')
    data  = []
    for exam in exams:
        student_exams = StudentExam.objects.filter(exam=exam, status='SUBMITTED')
        total         = student_exams.count()
        published     = Result.objects.filter(student_exam__in=student_exams, is_published=True).count()
        data.append({
            'id':             exam.id,
            'exam_name':      exam.exam_name,
            'exam_date':      str(exam.exam_date),
            'department':     exam.department,
            'semester':       exam.semester,
            'total_attempts': total,
            'published_count':published,
            'all_published':  total > 0 and published == total,
        })
    return Response(data)


# -------------------------------------------------
# STUDENT MY RESULT
# -------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_my_result(request, exam_id):
    user = request.user
    if user.role != 'STUDENT':
        return Response({'error': 'Only students allowed'}, status=403)
    try:
        student_exam = StudentExam.objects.get(exam_id=exam_id, student=user)
        result       = Result.objects.get(student_exam=student_exam)
        if not result.is_published:
            return Response({'error': 'Result not published yet'}, status=404)
        total      = student_exam.exam.total_questions_allowed * student_exam.exam.marks_correct
        percentage = round((result.score / total) * 100) if total > 0 else 0
        return Response({
            'exam':         student_exam.exam.exam_name,
            'score':        result.score,
            'percentage':   percentage,
            'submitted_at': student_exam.end_time,
            'is_published': result.is_published,
        })
    except StudentExam.DoesNotExist:
        return Response({'error': 'You have not attempted this exam'}, status=404)
    except Result.DoesNotExist:
        return Response({'error': 'Result not found'}, status=404)


# -------------------------------------------------
# CREATE USER
# -------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_user(request):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)

    username    = request.data.get('username')
    email       = request.data.get('email', '')
    password    = request.data.get('password') or username
    role        = request.data.get('role')
    department  = request.data.get('department', 'CS')
    semester    = request.data.get('semester', '1')
    roll_number = request.data.get('roll_number', '')

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists!'}, status=400)

    user = User.objects.create_user(username=username, email=email, password=password, role=role)

    if role == 'STUDENT':
        StudentProfile.objects.create(
            user=user,
            department=department,
            semester=semester,
            roll_number=roll_number or username
        )

    AuditLog.objects.create(
        user=request.user,
        action_type='CREATE_EXAM',
        description=f"Created {role} account: {username}"
    )

    return Response({
        'message':    f'{role} created successfully!',
        'username':   username,
        'password':   password,
        'role':       role,
        'department': department if role == 'STUDENT' else None,
        'semester':   semester   if role == 'STUDENT' else None,
    })


# -------------------------------------------------
# LIST STUDENTS
# -------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_students(request):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    students = User.objects.filter(role='STUDENT')
    data = []
    for s in students:
        profile = getattr(s, 'profile', None)
        data.append({
            'id':          s.id,
            'username':    s.username,
            'email':       s.email,
            'is_active':   s.is_active,
            'department':  profile.department  if profile else '—',
            'semester':    profile.semester    if profile else '—',
            'roll_number': profile.roll_number if profile else '—',
        })
    return Response(data)


# -------------------------------------------------
# ENROLL STUDENTS
# -------------------------------------------------
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def enroll_students(request, exam_id):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    try:
        exam = Exam.objects.get(id=exam_id)
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)

    if request.method == 'GET':
        students     = User.objects.filter(role='STUDENT', is_active=True)
        enrolled_ids = exam.enrolled_students.values_list('id', flat=True)
        data = []
        for s in students:
            profile = getattr(s, 'profile', None)
            data.append({
                'id':          s.id,
                'username':    s.username,
                'email':       s.email,
                'department':  profile.department  if profile else '—',
                'semester':    profile.semester    if profile else '—',
                'roll_number': profile.roll_number if profile else '—',
                'enrolled':    s.id in enrolled_ids,
            })
        return Response(data)

    if request.method == 'POST':
        student_ids = request.data.get('student_ids', [])
        exam.enrolled_students.set(student_ids)
        AuditLog.objects.create(
            user=request.user,
            action_type='ENROLL_STUDENT',
            description=f"Enrolled {len(student_ids)} students in {exam.exam_name}"
        )
        return Response({'message': f'{len(student_ids)} students enrolled!'})


# -------------------------------------------------
# DELETE QUESTION
# -------------------------------------------------
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_question(request, question_id):
    if request.user.role != 'STAFF':
        return Response({'error': 'Only staff allowed'}, status=403)
    try:
        question = Question.objects.get(id=question_id, created_by=request.user)
        if question.status != 'REJECTED':
            return Response({'error': 'Can only delete rejected questions!'}, status=400)
        question.delete()
        return Response({'message': 'Question deleted!'})
    except Question.DoesNotExist:
        return Response({'error': 'Question not found'}, status=404)


# -------------------------------------------------
# NOTIFICATIONS
# -------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    user          = request.user
    notifications = []

    if user.role == 'ADMIN':
        exams = Exam.objects.all()
        for exam in exams:
            if exam.workflow_status == 'SUBMITTED':
                notifications.append({
                    'id':        f'exam_submitted_{exam.id}',
                    'type':      'SUBMITTED',
                    'title':     'Exam Submitted for Approval',
                    'message':   f'"{exam.exam_name}" by {exam.assigned_staff.username if exam.assigned_staff else "staff"} is waiting for your review.',
                    'exam_id':   exam.id,
                    'exam_name': exam.exam_name,
                    'action':    'REVIEW',
                })
            if exam.workflow_status == 'LOCKED':
                notifications.append({
                    'id':        f'exam_locked_{exam.id}',
                    'type':      'LOCKED',
                    'title':     'Paper Locked on Blockchain!',
                    'message':   f'"{exam.exam_name}" has been locked.',
                    'exam_id':   exam.id,
                    'exam_name': exam.exam_name,
                    'action':    'VIEW',
                })
                now      = timezone.localtime()
                start_dt = timezone.make_aware(timezone.datetime.combine(exam.exam_date, exam.start_time))
                end_dt   = start_dt + timezone.timedelta(minutes=exam.duration_minutes)
                if now > end_dt:
                    total_enrolled  = exam.enrolled_students.count()
                    total_submitted = StudentExam.objects.filter(exam=exam, status='SUBMITTED').count()
                    if total_enrolled > 0:
                        notifications.append({
                            'id':        f'exam_done_{exam.id}',
                            'type':      'EXAM_DONE',
                            'title':     'Exam Completed!',
                            'message':   f'"{exam.exam_name}" is over. {total_submitted}/{total_enrolled} students submitted.',
                            'exam_id':   exam.id,
                            'exam_name': exam.exam_name,
                            'action':    'PUBLISH',
                        })

    elif user.role == 'STAFF':
        exams = Exam.objects.filter(assigned_staff=user)
        for exam in exams:
            if exam.workflow_status == 'APPROVED':
                notifications.append({
                    'id':        f'exam_approved_{exam.id}',
                    'type':      'APPROVED',
                    'title':     'Exam Approved!',
                    'message':   f'"{exam.exam_name}" approved. You can now lock the paper.',
                    'exam_id':   exam.id,
                    'exam_name': exam.exam_name,
                    'action':    'LOCK',
                })
            elif exam.workflow_status == 'REJECTED':
                notifications.append({
                    'id':        f'exam_rejected_{exam.id}',
                    'type':      'REJECTED',
                    'title':     'Exam Rejected',
                    'message':   f'"{exam.exam_name}" was rejected. Fix questions and resubmit.',
                    'exam_id':   exam.id,
                    'exam_name': exam.exam_name,
                    'action':    'FIX',
                })

            rejected_questions = Question.objects.filter(exam=exam, status='REJECTED')
            approved_questions = Question.objects.filter(exam=exam, status='APPROVED')

            if rejected_questions.exists():
                notifications.append({
                    'id':        f'qn_rejected_{exam.id}',
                    'type':      'QN_REJECTED',
                    'title':     f'{rejected_questions.count()} Question(s) Rejected',
                    'message':   f'Admin rejected {rejected_questions.count()} question(s) in "{exam.exam_name}".',
                    'exam_id':   exam.id,
                    'exam_name': exam.exam_name,
                    'count':     rejected_questions.count(),
                    'action':    'FIX',
                })
            if approved_questions.exists():
                notifications.append({
                    'id':        f'qn_approved_{exam.id}',
                    'type':      'QN_APPROVED',
                    'title':     f'{approved_questions.count()} Question(s) Approved',
                    'message':   f'Admin approved {approved_questions.count()} question(s) in "{exam.exam_name}".',
                    'exam_id':   exam.id,
                    'exam_name': exam.exam_name,
                    'count':     approved_questions.count(),
                    'action':    None,
                })

    elif user.role == 'STUDENT':
        student_exams = StudentExam.objects.filter(student=user, status='SUBMITTED')
        for se in student_exams:
            try:
                result = Result.objects.get(student_exam=se, is_published=True)
                notifications.append({
                    'id':        f'result_{se.exam.id}',
                    'type':      'RESULT_PUBLISHED',
                    'title':     'Result Published!',
                    'message':   f'Your result for "{se.exam.exam_name}" is now available.',
                    'exam_id':   se.exam.id,
                    'exam_name': se.exam.exam_name,
                    'action':    'VIEW_RESULT',
                })
            except Result.DoesNotExist:
                pass

    return Response(notifications)


# -------------------------------------------------
# UPDATE EXAM
# -------------------------------------------------
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_exam(request, exam_id):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    try:
        exam = Exam.objects.get(id=exam_id)
        if exam.workflow_status == 'LOCKED':
            return Response({'error': 'Cannot edit locked exam!'}, status=400)

        exam.exam_name               = request.data.get('exam_name',               exam.exam_name)
        exam.exam_date               = request.data.get('exam_date',               exam.exam_date)
        exam.start_time              = request.data.get('start_time',              exam.start_time)
        exam.duration_minutes        = request.data.get('duration_minutes',        exam.duration_minutes)
        exam.total_questions_allowed = request.data.get('total_questions_allowed', exam.total_questions_allowed)
        exam.marks_correct           = request.data.get('marks_correct',           exam.marks_correct)
        exam.marks_wrong             = request.data.get('marks_wrong',             exam.marks_wrong)
        exam.save()

        AuditLog.objects.create(user=request.user, action_type='UPDATE_EXAM', description=f"Updated exam: {exam.exam_name}")
        return Response({'message': 'Exam updated successfully!'})
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)


# -------------------------------------------------
# RESYNC ENROLLMENT
# -------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resync_enrollment(request, exam_id):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    try:
        exam = Exam.objects.get(id=exam_id)
        if exam.workflow_status == 'LOCKED':
            return Response({'error': 'Cannot change enrollment after locking!'}, status=400)

        department = exam.department
        semester   = exam.semester

        if department == 'ALL':
            students = User.objects.filter(role='STUDENT', is_active=True)
        else:
            students = User.objects.filter(role='STUDENT', is_active=True, profile__department=department)
            if semester:
                students = students.filter(profile__semester=semester)

        exam.enrolled_students.set(students)
        return Response({'message': f'Enrollment resynced! {students.count()} students enrolled.', 'enrolled_count': students.count()})
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)


# -------------------------------------------------
# STUDENT PROFILE
# -------------------------------------------------
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def student_profile(request):
    user = request.user
    if request.method == 'GET':
        profile        = getattr(user, 'profile', None)
        enrolled_exams = user.enrolled_exams.all()
        submitted      = StudentExam.objects.filter(student=user, status='SUBMITTED').count()
        return Response({
            'id':              user.id,
            'username':        user.username,
            'email':           user.email,
            'role':            user.role,
            'department':      profile.department  if profile else '—',
            'semester':        profile.semester    if profile else '—',
            'roll_number':     profile.roll_number if profile else '—',
            'total_enrolled':  enrolled_exams.count(),
            'total_submitted': submitted,
        })
    if request.method == 'PUT':
        email    = request.data.get('email')
        password = request.data.get('password')
        if email:    user.email = email; user.save()
        if password: user.set_password(password); user.save()
        return Response({'message': 'Profile updated successfully!'})


# -------------------------------------------------
# STAFF PROFILE
# -------------------------------------------------
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def staff_profile(request):
    user = request.user
    if request.method == 'GET':
        return Response({'id': user.id, 'username': user.username, 'email': user.email, 'role': user.role})
    if request.method == 'PUT':
        email    = request.data.get('email')
        password = request.data.get('password')
        if email:    user.email = email; user.save()
        if password: user.set_password(password); user.save()
        return Response({'message': 'Profile updated!'})


# -------------------------------------------------
# STUDENT RESULT DETAIL
# -------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_result_detail(request, result_id):
    try:
        result       = Result.objects.get(id=result_id, student_exam__student=request.user)
        student_exam = result.student_exam
        answers      = []
        for sa in StudentAnswer.objects.filter(student_exam=student_exam):
            answers.append({
                'question_text':   sa.question.question_text,
                'option_a':        sa.question.option_a,
                'option_b':        sa.question.option_b,
                'option_c':        sa.question.option_c,
                'option_d':        sa.question.option_d,
                'correct_option':  sa.question.correct_option,
                'selected_option': sa.selected_option,
                'is_correct':      sa.is_correct,
                'marks_correct':   sa.question.exam.marks_correct,
                'marks_wrong':     sa.question.exam.marks_wrong,
            })
        return Response({'answers': answers})
    except Result.DoesNotExist:
        return Response({'error': 'Result not found'}, status=404)


# -------------------------------------------------
# ADMIN REPORTS
# -------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_reports(request):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)

    exams        = Exam.objects.filter(workflow_status='LOCKED')
    exam_reports = []

    total_students_all = 0
    total_pass_rates   = []
    total_avg_scores   = []

    for exam in exams:
        results = Result.objects.filter(
            student_exam__exam=exam, is_published=True
        ).select_related('student_exam__student__profile')

        if not results.exists():
            continue

        scores      = [r.score for r in results]
        total_marks = exam.total_questions_allowed * exam.marks_correct
        percentages = [round((s / total_marks) * 100, 1) if total_marks > 0 else 0 for s in scores]

        passed  = sum(1 for p in percentages if p >= 40)
        failed  = len(percentages) - passed
        grade_a = sum(1 for p in percentages if p >= 80)
        grade_b = sum(1 for p in percentages if 60 <= p < 80)
        grade_c = sum(1 for p in percentages if 40 <= p < 60)
        grade_f = sum(1 for p in percentages if p < 40)

        avg_score = round(sum(percentages) / len(percentages), 1) if percentages else 0
        pass_rate = round((passed / len(percentages)) * 100, 1)    if percentages else 0

        total_students_all += len(results)
        total_pass_rates.append(pass_rate)
        total_avg_scores.append(avg_score)

        students_data = []
        for r in results:
            pct     = round((r.score / total_marks) * 100, 1) if total_marks > 0 else 0
            profile = getattr(r.student_exam.student, 'profile', None)
            students_data.append({
                'username':    r.student_exam.student.username,
                'roll_number': profile.roll_number if profile else '—',
                'score':       r.score,
                'total_marks': total_marks,
                'percentage':  pct,
            })

        students_data.sort(key=lambda x: x['percentage'], reverse=True)

        exam_reports.append({
            'exam_id':        exam.id,
            'exam_name':      exam.exam_name,
            'exam_date':      str(exam.exam_date),
            'department':     exam.department,
            'semester':       exam.semester,
            'total_enrolled': exam.enrolled_students.count(),
            'total_students': len(results),
            'passed':         passed,
            'failed':         failed,
            'grade_a':        grade_a,
            'grade_b':        grade_b,
            'grade_c':        grade_c,
            'grade_f':        grade_f,
            'avg_score':      avg_score,
            'pass_rate':      pass_rate,
            'students':       students_data,
        })

    overall = {
        'total_exams':    len(exam_reports),
        'total_students': total_students_all,
        'avg_pass_rate':  round(sum(total_pass_rates) / len(total_pass_rates), 1) if total_pass_rates else 0,
        'avg_score':      round(sum(total_avg_scores) / len(total_avg_scores), 1) if total_avg_scores else 0,
    }

    return Response({'overall': overall, 'exam_reports': exam_reports})


# -------------------------------------------------
# GET PUBLISH RESULTS
# -------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_publish_results(request, exam_id):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    try:
        exam = Exam.objects.get(id=exam_id)
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)

    student_exams   = StudentExam.objects.filter(exam=exam, status='SUBMITTED').select_related('student', 'student__profile')
    students_data   = []
    published_count = 0

    for se in student_exams:
        profile = getattr(se.student, 'profile', None)
        try:
            result      = Result.objects.get(student_exam=se)
            if result.is_published:
                published_count += 1
            total_marks = result.total_marks or (exam.total_questions_allowed * exam.marks_correct)
            percentage  = result.percentage or 0
        except Result.DoesNotExist:
            answers = StudentAnswer.objects.filter(student_exam=se)
            score   = 0
            correct = 0
            for sa in answers:
                if sa.is_correct:
                    score += exam.marks_correct
                    correct += 1
                elif sa.selected_option:
                    score += exam.marks_wrong
            score       = max(0, score)
            total_marks = exam.total_questions_allowed * exam.marks_correct
            percentage  = round((score / total_marks) * 100, 1) if total_marks > 0 else 0
            result      = Result.objects.create(
                student_exam    = se,
                score           = score,
                total_marks     = total_marks,
                percentage      = percentage,
                correct_count   = correct,
                total_questions = exam.questions.filter(status='APPROVED').count(),
                is_published    = False,
            )

        students_data.append({
            'result_id':    result.id,
            'student_id':   se.student.id,
            'username':     se.student.username,
            'roll_number':  profile.roll_number if profile else '—',
            'score':        result.score,
            'total_marks':  result.total_marks,
            'percentage':   result.percentage,
            'is_published': result.is_published,
        })

    students_data.sort(key=lambda x: x['percentage'], reverse=True)

    return Response({
        'exam_id':         exam.id,
        'exam_name':       exam.exam_name,
        'exam_date':       str(exam.exam_date),
        'department':      exam.department,
        'semester':        exam.semester,
        'total_attempted': len(students_data),
        'total_published': published_count,
        'students':        students_data,
    })


# -------------------------------------------------
# STUDENT RESULTS ✅ NEW — list all submitted exams
# -------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_results(request):
    user = request.user
    if user.role != 'STUDENT':
        return Response({'error': 'Only students allowed'}, status=403)

    student_exams = StudentExam.objects.filter(student=user, status='SUBMITTED').select_related('exam')
    results       = []

    for se in student_exams:
        try:
            result = Result.objects.get(student_exam=se)
            if result.is_published:
                results.append({
                    'id':              result.id,
                    'exam_id':         se.exam.id,
                    'exam_name':       se.exam.exam_name,
                    'exam_date':       str(se.exam.exam_date),
                    'department':      se.exam.department,
                    'semester':        se.exam.semester,
                    'score':           result.score,
                    'total_marks':     result.total_marks,
                    'percentage':      result.percentage,
                    'correct_count':   result.correct_count,
                    'total_questions': result.total_questions,
                    'is_published':    True,
                })
            else:
                results.append({
                    'id':           None,
                    'exam_id':      se.exam.id,
                    'exam_name':    se.exam.exam_name,
                    'exam_date':    str(se.exam.exam_date),
                    'department':   se.exam.department,
                    'semester':     se.exam.semester,
                    'score':        None,
                    'total_marks':  None,
                    'percentage':   None,
                    'is_published': False,
                })
        except Result.DoesNotExist:
            results.append({
                'id':           None,
                'exam_id':      se.exam.id,
                'exam_name':    se.exam.exam_name,
                'exam_date':    str(se.exam.exam_date),
                'department':   se.exam.department,
                'semester':     se.exam.semester,
                'score':        None,
                'total_marks':  None,
                'percentage':   None,
                'is_published': False,
            })

    return Response(results)
