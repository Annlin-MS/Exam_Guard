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

    # Time check
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
        return Response(
            {'error': 'You are not enrolled in this exam'},
            status=403
        )

    student_exam, created = StudentExam.objects.get_or_create(
        student=user,
        exam=exam
    )

    if not created:
        return Response({'error': 'Exam already started or submitted'}, status=403)

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

    # Placeholder (IPFS + decryption will be added later)
    questions_qs = exam.questions.all()
    questions = [{
    'id': q.id,
    'question_text': q.question_text,
    'option_a': q.option_a,
    'option_b': q.option_b,
    'option_c': q.option_c,
    'option_d': q.option_d,
    # ❌ NO correct_option here!
} for q in questions_qs]


    return Response({
        'exam': exam.exam_name,
        'questions': questions
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

    answers = request.data.get('answers', [])

    try:
        student_exam = StudentExam.objects.get(
            student=user,
            exam_id=exam_id
        )
    except StudentExam.DoesNotExist:
        return Response({'error': 'Exam not started'}, status=404)

    if student_exam.status == 'SUBMITTED':
        return Response({'error': 'Exam already submitted'}, status=403)

    exam = student_exam.exam

    # ------------------------------------------------
    # 1️⃣ Evaluate answers (+4 / -1)
    # ------------------------------------------------
    questions = exam.questions.all()
    correct_map = {q.id: q.correct_option for q in questions}

    score = 0
    for ans in answers:
        qid = ans.get('question_id')
        selected = ans.get('selected_option')

        if qid in correct_map:
            if selected == correct_map[qid]:
                score += exam.marks_correct
            else:
                score += exam.marks_wrong

    # ------------------------------------------------
    # 2️⃣ Save result locally
    # ------------------------------------------------
    student_exam.status = 'SUBMITTED'
    student_exam.end_time = timezone.now()
    student_exam.save()

    # ------------------------------------------------
    # 3️⃣ Build result hash
    # ------------------------------------------------
    result_string = f"{exam.id}|{user.id}|{score}|{student_exam.end_time.isoformat()}"
    result_hash = hashlib.sha256(result_string.encode()).hexdigest()

    # ------------------------------------------------
    # 4️⃣ Commit result hash to blockchain
    # ------------------------------------------------
    student_hash = hashlib.sha256(
        str(user.id).encode()
    ).hexdigest()

    try:
        tx_hash = contract.functions.commitResult(
            exam.id,
            web3.to_bytes(hexstr="0x" + student_hash),
            web3.to_bytes(hexstr="0x" + result_hash)
        ).transact()
    except Exception as e:
        return Response({'error': str(e)}, status=500)

    # ------------------------------------------------
    # 5️⃣ Store result + tx hash
    # ------------------------------------------------
    Result.objects.create(
        student_exam=student_exam,
        score=score,
        result_hash=result_hash
    )
    create_audit_log(
      request.user,
      'SUBMIT_EXAM',
      f"Submitted exam: {exam.exam_name}"
)

    return Response({
        'message': 'Exam submitted successfully',
        'score': score,
        'blockchain_tx_hash': tx_hash.hex()
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

    # Only STAFF can lock
    if user.role != 'STAFF':
        return Response(
            {'error': 'Only staff can lock question paper'},
            status=403
        )

    # Fetch exam
    try:
        exam = Exam.objects.get(id=exam_id)
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)
    
    # ✅ NEW SECURITY CHECK (ADD HERE)
    if exam.assigned_staff_id != user.id:
     return Response( {'error': 'Not assigned to this exam'},
        status=403
    )

    # 🔴 NEW: Check if admin approved
    if exam.workflow_status != 'APPROVED':
        return Response(
            {'error': 'Exam not approved by admin'},
            status=400
        )

    # 🔹 CREATE QuestionPaper automatically if not exists
    qp, created = QuestionPaper.objects.get_or_create(
        exam=exam,
        defaults={
            'uploaded_by': user,
            'question_hash': '',
            'is_locked': False
        }
    )

    # Already locked?
    if qp.is_locked:
        return Response(
            {'error': 'Question paper already locked'},
            status=400
        )

    # Fetch questions
    questions = exam.questions.all().order_by('id')
    
    if questions.count() != exam.total_questions_allowed:
     return Response(
        {
            'error': f'Exam requires {exam.total_questions_allowed} questions. '
                     f'Currently added: {questions.count()}'
        },
        status=400
    )

    if not questions.exists():
        return Response(
            {'error': 'No questions found for this exam'},
            status=400
        )

    # Build deterministic payload
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

    payload_json = json.dumps(payload, sort_keys=True)
    question_hash = hashlib.sha256(payload_json.encode()).hexdigest()

    # Save hash locally
    qp.question_hash = question_hash

    # Blockchain timestamps
    start_ts = int(
        timezone.make_aware(
            timezone.datetime.combine(
                exam.exam_date,
                exam.start_time
            )
        ).timestamp()
    )
    end_ts = start_ts + exam.duration_minutes * 60

    # Blockchain call
    try:
        tx_hash = contract.functions.registerExam(
            exam.id,
            web3.to_bytes(hexstr="0x" + question_hash),
            start_ts,
            end_ts
        ).transact()
    except Exception as e:
        return Response({'error': str(e)}, status=500)

    # Save blockchain tx
    qp.blockchain_tx_hash = tx_hash.hex()
    qp.is_locked = True
    qp.locked_at = timezone.now()
    qp.save()

    # 🔴 NEW: Update exam workflow status
    exam.workflow_status = 'LOCKED'
    exam.save()

    create_audit_log(
    request.user,
    'LOCK_PAPER',
    f"Locked question paper for {exam.exam_name}"
)


    return Response({
        'message': 'Question paper locked successfully',
        'blockchain_tx_hash': qp.blockchain_tx_hash
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_question_paper(request, exam_id):
    user = request.user

    if user.role != 'ADMIN':
        return Response(
            {'error': 'Only admin can verify question paper'},
            status=403
        )

    try:
        exam = Exam.objects.get(id=exam_id)
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)

    try:
        qp = QuestionPaper.objects.get(exam=exam)
    except QuestionPaper.DoesNotExist:
        return Response({'error': 'Question paper not found'}, status=404)

    # Recompute hash from DB
    questions = exam.questions.all().order_by('id')

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

    payload_json = json.dumps(payload, sort_keys=True)
    local_hash = hashlib.sha256(payload_json.encode()).hexdigest()

    if local_hash == qp.question_hash:
        return Response({
            'status': 'VERIFIED',
            'message': 'Question paper integrity verified. No tampering detected.'
        })
    else:
        return Response({
            'status': 'TAMPERED',
            'message': 'Mismatch detected! Question paper may have been altered.'
        })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_result(request, exam_id, student_id):

    user = request.user

    # Role check
    if user.role == 'ADMIN':
        pass
    elif user.role == 'STUDENT' and user.id == student_id:
        pass
    else:
        return Response({'error': 'Not allowed'}, status=403)

    try:
        student_exam = StudentExam.objects.get(
            exam_id=exam_id,
            student_id=student_id
        )
    except StudentExam.DoesNotExist:
        return Response({'error': 'Result not found'}, status=404)

    try:
        result = Result.objects.get(student_exam=student_exam)
    except Result.DoesNotExist:
        return Response({'error': 'Result record missing'}, status=404)

    result_string = (
        f"{exam_id}|{student_id}|{result.score}|"
        f"{student_exam.end_time.isoformat()}"
    )

    local_hash = hashlib.sha256(result_string.encode()).hexdigest()
    student_hash = hashlib.sha256(str(student_id).encode()).hexdigest()

    # 🔥 ADD BLOCKCHAIN FETCH HERE
    try:
        blockchain_hash = contract.functions.getResult(
            exam_id,
            bytes.fromhex(student_hash)
        ).call()

        blockchain_hash_hex = blockchain_hash.hex()
    except Exception as e:
        return Response({"blockchain_error": str(e)}, status=500)

    # 🔥 RETURN EVERYTHING FOR DEBUG
    return Response({
        "local_hash": local_hash,
        "local_hash_length": len(local_hash),
        "student_hash": student_hash,
        "blockchain_hash": blockchain_hash_hex,
        "blockchain_hash_length": len(blockchain_hash_hex)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_my_result(request, exam_id):
    user = request.user

    if user.role != 'STUDENT':
        return Response(
            {'error': 'Only students can view their results'},
            status=403
        )

    try:
        student_exam = StudentExam.objects.get(
            exam_id=exam_id,
            student=user
        )
    except StudentExam.DoesNotExist:
        return Response(
            {'error': 'You have not attempted this exam'},
            status=404
        )

    try:
        result = Result.objects.get(student_exam=student_exam)
    except Result.DoesNotExist:
        return Response(
            {'error': 'Result not published yet'},
            status=404
        )

    return Response({
        'exam': student_exam.exam.exam_name,
        'score': result.score,
        'result_hash': result.result_hash,
        'submitted_at': student_exam.end_time,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_exams(request):
    user = request.user
    now = timezone.localtime()

    # 🔥 Role-based exam visibility
    if user.role == 'STUDENT':
        exams = user.enrolled_exams.filter(workflow_status='LOCKED')
    elif user.role == 'STAFF':
        exams = Exam.objects.filter(assigned_staff=user)
    else:  # ADMIN
        exams = Exam.objects.all()

    exam_list = []

    for exam in exams:
        start_datetime = timezone.make_aware(
            timezone.datetime.combine(
                exam.exam_date,
                exam.start_time
            )
        )

        end_datetime = start_datetime + timezone.timedelta(
            minutes=exam.duration_minutes
        )

        student_exam = StudentExam.objects.filter(
            student=user,
            exam=exam
        ).first()

        if student_exam and student_exam.status == "SUBMITTED":
            status = "SUBMITTED"
        elif now > end_datetime:
            status = "MISSED"
        elif start_datetime <= now <= end_datetime:
            status = "ONGOING"
        else:
            status = "UPCOMING"

        exam_list.append({
            "id": exam.id,
            "exam_name": exam.exam_name,
            "exam_date": str(exam.exam_date),
            "start_time": str(exam.start_time),
            "end_time": str(end_datetime.time()),
            "duration": exam.duration_minutes,
            "status": status,
            "workflow_status": exam.workflow_status,
            "total_questions_allowed": exam.total_questions_allowed,
            "assigned_staff": exam.assigned_staff.username if exam.assigned_staff else None,
            "marks_correct": exam.marks_correct,
            "marks_wrong": exam.marks_wrong,
            "department": exam.department,
            "semester": exam.semester,
            "enrolled_students_count": exam.enrolled_students.count(),
        }),

    return Response(exam_list)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    print("✅ LOGIN HIT")
    print("RAW BODY:", request.body)
    print("DATA:", request.data)
    
    username = request.data.get("username")
    password = request.data.get("password")
    
    print("USERNAME:", username)
    print("PASSWORD:", password)
    
    user = authenticate(username=username, password=password)
    print("AUTH RESULT:", user)
    
    if user is None:
        return Response({"error": "Invalid credentials"}, status=400)

    token, created = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "role": user.role, "username": user.username})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_for_approval(request, exam_id):
    if request.user.role != 'STAFF':
        return Response({'error': 'Only staff allowed'}, status=403)
    try:
        exam = Exam.objects.get(
            id=exam_id,
            assigned_staff=request.user
        )

        # Allow DRAFT and REJECTED to submit/resubmit
        if exam.workflow_status not in ['DRAFT', 'REJECTED']:
            return Response(
                {'error': f'Cannot submit — status is {exam.workflow_status}'},
                status=400
            )

        # Check no rejected questions remain
        rejected_count = exam.questions.filter(status='REJECTED').count()
        if rejected_count > 0:
            return Response(
                {'error': f'Please delete {rejected_count} rejected question(s) first!'},
                status=400
            )

        # Check enough questions
        total = exam.questions.count()
        if total < exam.total_questions_allowed:
            return Response(
                {'error': f'Need {exam.total_questions_allowed} questions. Have {total}.'},
                status=400
            )

        # Reset approved questions back to PENDING on resubmit
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

    create_audit_log(
    request.user,
    'APPROVE_EXAM',
    f"Approved exam: {exam.exam_name}"
)

    return Response({'message': 'Exam approved successfully'})

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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_staff(request):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)

    staff = User.objects.filter(role='STAFF')
    data = [{
        'id': s.id,
        'username': s.username,
        'email': s.email,
        'is_active': s.is_active
    } for s in staff]

    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_students(request):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)

    students = User.objects.filter(role='STUDENT')
    data = [{
        'id': s.id,
        'username': s.username,
        'email': s.email,
        'is_active': s.is_active
    } for s in students]

    return Response(data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enroll_students(request, exam_id):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)

    try:
        exam = Exam.objects.get(id=exam_id)
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)

    student_ids = request.data.get('student_ids', [])

    students = User.objects.filter(id__in=student_ids, role='STUDENT')
    exam.enrolled_students.set(students)

    create_audit_log(
    request.user,
    'ENROLL_STUDENT',
    f"Enrolled students to exam: {exam.exam_name}"
)

    return Response({'message': 'Students enrolled successfully'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):

    user = request.user

    if user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)

    total_exams = Exam.objects.count()
    active_exams = Exam.objects.filter(workflow_status='LOCKED').count()
    total_staff = User.objects.filter(role='STAFF').count()
    total_students = User.objects.filter(role='STUDENT').count()
    pending_approvals = Exam.objects.filter(workflow_status='SUBMITTED').count()

    return Response({
        "total_exams": total_exams,
        "active_exams": active_exams,
        "total_staff": total_staff,
        "total_students": total_students,
        "pending_approvals": pending_approvals
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def view_audit_logs(request):

    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)

    logs = AuditLog.objects.all().order_by('-timestamp')[:50]

    data = [{
        "user": log.user.username if log.user else "System",
        "action": log.action_type,
        "description": log.description,
        "timestamp": log.timestamp
    } for log in logs]

    return Response(data)

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

    # 🔹 STEP 3 — Question limit check
    question_count = Question.objects.filter(exam=exam).count()

    if question_count >= exam.total_questions_allowed:
        return Response(
            {'error': 'Question limit reached for this exam'},
            status=400
        )

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
    create_audit_log(
    request.user,
    'ADD_QUESTION',
    f"Added question to exam: {exam.exam_name}"
)

    return Response({'message': 'Question created successfully'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def blockchain_status(request):

    user = request.user

    if user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)

    try:
        is_connected = web3.is_connected()
        block_number = web3.eth.block_number
        admin_account = web3.eth.default_account

        return Response({
            "connected": is_connected,
            "current_block": block_number,
            "admin_account": admin_account
        })

    except Exception as e:
        return Response({
            "connected": False,
            "error": str(e)
        }, status=500)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_exam(request):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)

    try:
        assigned_staff_id = request.data.get('assigned_staff')
        assigned_staff = User.objects.get(
            id=assigned_staff_id, role='STAFF'
        ) if assigned_staff_id else None

        department = request.data.get('department', 'ALL')
        semester   = request.data.get('semester', None)

        exam = Exam.objects.create(
            exam_name              = request.data.get('exam_name'),
            exam_date              = request.data.get('exam_date'),
            start_time             = request.data.get('start_time'),
            duration_minutes       = request.data.get('duration_minutes'),
            total_questions_allowed= request.data.get('total_questions_allowed', 10),
            marks_correct          = request.data.get('marks_correct', 4),
            marks_wrong            = request.data.get('marks_wrong', -1),
            created_by             = request.user,
            assigned_staff         = assigned_staff,
            department             = department,
            semester               = semester,
        )

        # ── AUTO ENROLL students by department/semester ──
        if department == 'ALL':
            students = User.objects.filter(role='STUDENT', is_active=True)
        else:
            students = User.objects.filter(
                role='STUDENT',
                is_active=True,
                profile__department=department
            )
            if semester:
                students = students.filter(profile__semester=semester)

        exam.enrolled_students.set(students)

        AuditLog.objects.create(
            user=request.user,
            action_type='CREATE_EXAM',
            description=f"Created exam: {exam.exam_name} for {department} Sem {semester or 'All'}"
        )

        return Response({
            'message': 'Exam created successfully!',
            'exam_id': exam.id,
            'enrolled_count': students.count(),
            'department': department,
            'semester': semester,
        })

    except Exception as e:
        return Response({'error': str(e)}, status=400)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_questions(request, exam_id):
    try:
        exam = Exam.objects.get(id=exam_id)
        questions = Question.objects.filter(exam=exam)
        data = []
        for q in questions:
            data.append({
                'id': q.id,
                'question_text': q.question_text,
                'option_a': q.option_a,
                'option_b': q.option_b,
                'option_c': q.option_c,
                'option_d': q.option_d,
                'correct_option': q.correct_option,
                'status': q.status,                          
                'rejection_reason': q.rejection_reason or '', 
            })
        return Response(data)
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_user(request):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    user = User.objects.create_user(
        username=request.data.get('username'),
        email=request.data.get('email'),
        password=request.data.get('password'),
        role=request.data.get('role')
    )
    return Response({'message': f'{user.role} created successfully'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_user(request, user_id):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    user = User.objects.get(id=user_id)
    user.is_active = not user.is_active
    user.save()
    return Response({'message': 'Updated', 'is_active': user.is_active})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    current = request.data.get('current_password')
    new_pass = request.data.get('new_password')
    if not user.check_password(current):
        return Response({'error': 'Current password is wrong!'}, status=400)
    user.set_password(new_pass)
    user.save()
    return Response({'message': 'Password changed successfully!'})       

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_pending_questions(request):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)

    questions = Question.objects.all().select_related('exam', 'created_by')
    
    data = [{
        'id': q.id,
        'question_text': q.question_text,
        'option_a': q.option_a,
        'option_b': q.option_b,
        'option_c': q.option_c,
        'option_d': q.option_d,
        'correct_option': q.correct_option,
        'exam_id': q.exam.id,
        'exam_name': q.exam.exam_name,
        'created_by': q.created_by.username,
        'status': q.status,
    } for q in questions]

    return Response(data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_question(request, question_id):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    try:
        question = Question.objects.get(id=question_id)
        question.status = 'APPROVED'
        question.rejection_reason = ''
        question.save()
        return Response({'message': 'Question approved!'})
    except Question.DoesNotExist:
        return Response({'error': 'Question not found'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_question(request, question_id):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    try:
        question = Question.objects.get(id=question_id)
        question.status = 'REJECTED'
        question.rejection_reason = request.data.get('reason', 'No reason provided')
        question.save()
        return Response({'message': 'Question rejected!'})
    except Question.DoesNotExist:
        return Response({'error': 'Question not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def staff_exam_results(request, exam_id):
    if request.user.role != 'STAFF':
        return Response({'error': 'Only staff allowed'}, status=403)

    try:
        exam = Exam.objects.get(id=exam_id)
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)

    student_exams = StudentExam.objects.filter(
        exam=exam, status='SUBMITTED'
    ).select_related('student')

    data = []
    for se in student_exams:
        try:
            result = Result.objects.get(student_exam=se)
            total_marks = exam.total_questions_allowed * exam.marks_correct
            percentage = round((result.score / total_marks) * 100) if total_marks > 0 else 0
            data.append({
                'student_name': se.student.username,
                'score': result.score,
                'percentage': percentage,
                'result_hash': result.result_hash,
                'submitted_at': se.end_time,
            })
        except Result.DoesNotExist:
            pass

    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_my_result(request, exam_id):
    user = request.user
    if user.role != 'STUDENT':
        return Response({'error': 'Only students allowed'}, status=403)
    try:
        student_exam = StudentExam.objects.get(exam_id=exam_id, student=user)
        result = Result.objects.get(student_exam=student_exam)
        total = student_exam.exam.total_questions_allowed * student_exam.exam.marks_correct
        percentage = round((result.score / total) * 100) if total > 0 else 0
        return Response({
            'exam': student_exam.exam.exam_name,
            'score': result.score,
            'percentage': percentage,
            'result_hash': result.result_hash,
            'submitted_at': student_exam.end_time,
        })
    except Exception:
        return Response({'error': 'Result not found'}, status=404)  

  # ================================================
# PUBLISH RESULTS — Admin publishes results
# ================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def publish_results(request, exam_id):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    try:
        exam = Exam.objects.get(id=exam_id)
        # Get all results for this exam
        student_exams = StudentExam.objects.filter(exam=exam, status='SUBMITTED')
        count = 0
        for se in student_exams:
            try:
                result = Result.objects.get(student_exam=se)
                result.is_published = True
                result.save()
                count += 1
            except Result.DoesNotExist:
                pass
        AuditLog.objects.create(
            user=request.user,
            action_type='COMMIT_RESULT',
            description=f"Published {count} results for exam: {exam.exam_name}"
        )
        return Response({'message': f'Published {count} results successfully!'})
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)


# ================================================
# VERIFY RESULT HASH — Admin verifies result integrity
# ================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_result_hash(request, exam_id):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    try:
        exam = Exam.objects.get(id=exam_id)
        student_exams = StudentExam.objects.filter(
            exam=exam, status='SUBMITTED'
        ).select_related('student')

        results = []
        for se in student_exams:
            try:
                result = Result.objects.get(student_exam=se)
                # Regenerate hash to verify
                import hashlib
                data = f"{se.student.id}{exam.id}{result.score}"
                regenerated_hash = hashlib.sha256(data.encode()).hexdigest()
                is_valid = regenerated_hash == result.result_hash
                results.append({
                    'student_name': se.student.username,
                    'score': result.score,
                    'stored_hash': result.result_hash,
                    'regenerated_hash': regenerated_hash,
                    'is_valid': is_valid,
                    'is_published': result.is_published,
                })
            except Result.DoesNotExist:
                pass
        return Response({
            'exam': exam.exam_name,
            'results': results,
            'all_valid': all(r['is_valid'] for r in results),
        })
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)


# ================================================
# ADMIN LIST RESULTS — All exams with results
# ================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_list_results(request):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Only admin allowed'}, status=403)
    exams = Exam.objects.filter(workflow_status='LOCKED')
    data = []
    for exam in exams:
        student_exams = StudentExam.objects.filter(exam=exam, status='SUBMITTED')
        total = student_exams.count()
        published = Result.objects.filter(
            student_exam__in=student_exams,
            is_published=True
        ).count()
        data.append({
            'id': exam.id,
            'exam_name': exam.exam_name,
            'exam_date': str(exam.exam_date),
            'total_attempts': total,
            'published_count': published,
            'all_published': total > 0 and published == total,
        })
    return Response(data)


# ================================================
# STUDENT MY RESULT — Only published results
# ================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_my_result(request, exam_id):
    user = request.user
    if user.role != 'STUDENT':
        return Response({'error': 'Only students allowed'}, status=403)
    try:
        student_exam = StudentExam.objects.get(exam_id=exam_id, student=user)
        result = Result.objects.get(student_exam=student_exam)
        if not result.is_published:
            return Response({'error': 'Result not published yet'}, status=404)
        total = student_exam.exam.total_questions_allowed * student_exam.exam.marks_correct
        percentage = round((result.score / total) * 100) if total > 0 else 0
        return Response({
            'exam': student_exam.exam.exam_name,
            'score': result.score,
            'percentage': percentage,
            'submitted_at': student_exam.end_time,
            'is_published': result.is_published,
        })
    except Exception:
        return Response({'error': 'Result not found'}, status=404)    

# ================================================
# CREATE USER — updated to create StudentProfile
# ================================================
from exam.models import User, Exam, Question, QuestionPaper, StudentExam, Result, AuditLog, StudentProfile

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

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        role=role
    )

    # Create StudentProfile if role is STUDENT
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
        'message': f'{role} created successfully!',
        'username': username,
        'password': password,
        'role': role,
        'department': department if role == 'STUDENT' else None,
        'semester': semester if role == 'STUDENT' else None,
    })


# ================================================
# LIST STUDENTS — with profile info
# ================================================
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
            'id': s.id,
            'username': s.username,
            'email': s.email,
            'is_active': s.is_active,
            'department': profile.department if profile else '—',
            'semester': profile.semester if profile else '—',
            'roll_number': profile.roll_number if profile else '—',
        })
    return Response(data)


# ================================================
# ENROLL STUDENTS — by department/semester
# ================================================
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
        # Return all students with enrollment status
        students = User.objects.filter(role='STUDENT', is_active=True)
        enrolled_ids = exam.enrolled_students.values_list('id', flat=True)
        data = []
        for s in students:
            profile = getattr(s, 'profile', None)
            data.append({
                'id': s.id,
                'username': s.username,
                'email': s.email,
                'department': profile.department if profile else '—',
                'semester': profile.semester if profile else '—',
                'roll_number': profile.roll_number if profile else '—',
                'enrolled': s.id in enrolled_ids,
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

      # ================================================
# NOTIFICATIONS — for staff
# ================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    user = request.user
    notifications = []

    if user.role == 'STAFF':
        # Get all exams assigned to this staff
        exams = Exam.objects.filter(assigned_staff=user)
        for exam in exams:
            # Exam level notifications
            if exam.workflow_status == 'APPROVED':
                notifications.append({
                    'id': f'exam_approved_{exam.id}',
                    'type': 'APPROVED',
                    'title': 'Exam Approved!',
                    'message': f'"{exam.exam_name}" has been approved. You can now lock the paper.',
                    'exam_id': exam.id,
                    'exam_name': exam.exam_name,
                    'action': 'LOCK',
                })
            elif exam.workflow_status == 'REJECTED':
                notifications.append({
                    'id': f'exam_rejected_{exam.id}',
                    'type': 'REJECTED',
                    'title': 'Exam Rejected',
                    'message': f'"{exam.exam_name}" was rejected by admin. Fix the questions and resubmit.',
                    'exam_id': exam.id,
                    'exam_name': exam.exam_name,
                    'action': 'FIX',
                })

            # Question level notifications
            rejected_questions = Question.objects.filter(
                exam=exam, status='REJECTED'
            )
            approved_questions = Question.objects.filter(
                exam=exam, status='APPROVED'
            )

            if rejected_questions.exists():
                notifications.append({
                    'id': f'qn_rejected_{exam.id}',
                    'type': 'QN_REJECTED',
                    'title': f'{rejected_questions.count()} Question(s) Rejected',
                    'message': f'Admin rejected {rejected_questions.count()} question(s) in "{exam.exam_name}". Check feedback and fix them.',
                    'exam_id': exam.id,
                    'exam_name': exam.exam_name,
                    'count': rejected_questions.count(),
                    'action': 'FIX',
                })

            if approved_questions.exists():
                notifications.append({
                    'id': f'qn_approved_{exam.id}',
                    'type': 'QN_APPROVED',
                    'title': f'{approved_questions.count()} Question(s) Approved',
                    'message': f'Admin approved {approved_questions.count()} question(s) in "{exam.exam_name}".',
                    'exam_id': exam.id,
                    'exam_name': exam.exam_name,
                    'count': approved_questions.count(),
                    'action': None,
                })

    elif user.role == 'STUDENT':
        # Student notifications — published results
        student_exams = StudentExam.objects.filter(
            student=user, status='SUBMITTED'
        )
        for se in student_exams:
            try:
                result = Result.objects.get(
                    student_exam=se, is_published=True
                )
                notifications.append({
                    'id': f'result_{se.exam.id}',
                    'type': 'RESULT_PUBLISHED',
                    'title': 'Result Published!',
                    'message': f'Your result for "{se.exam.exam_name}" is now available.',
                    'exam_id': se.exam.id,
                    'exam_name': se.exam.exam_name,
                    'action': 'VIEW_RESULT',
                })
            except Result.DoesNotExist:
                pass

    return Response(notifications)  

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_question(request, question_id):
    if request.user.role != 'STAFF':
        return Response({'error': 'Only staff allowed'}, status=403)
    try:
        question = Question.objects.get(
            id=question_id,
            created_by=request.user
        )
        # Only allow deleting REJECTED questions
        if question.status != 'REJECTED':
            return Response(
                {'error': 'Can only delete rejected questions!'},
                status=400
            )
        question.delete()
        return Response({'message': 'Question deleted!'})
    except Question.DoesNotExist:
        return Response({'error': 'Question not found'}, status=404)