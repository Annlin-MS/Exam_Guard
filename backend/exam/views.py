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
    questions = []

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
            web3.to_bytes(hexstr=student_hash),
            web3.to_bytes(hexstr=result_hash)
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
            web3.to_bytes(hexstr=question_hash),
            start_ts,
            end_ts
        ).transact()
    except Exception as e:
        return Response({'error': str(e)}, status=500)

    # Save blockchain tx
    qp.blockchain_tx_hash = tx_hash.hex()
    qp.is_locked = True
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
        exams = user.enrolled_exams.all()
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
            "exam_date": exam.exam_date,
            "start_time": exam.start_time,
            "end_time": end_datetime.time(),
            "duration": exam.duration_minutes,
            "status": status
        })

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
    return Response({"token": token.key, "role": user.role})



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_for_approval(request, exam_id):
    user = request.user

    if user.role != 'STAFF':
        return Response({'error': 'Only staff allowed'}, status=403)

    try:
        exam = Exam.objects.get(id=exam_id)
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)

    if exam.assigned_staff != user:
        return Response({'error': 'Not assigned to this exam'}, status=403)
    
    if exam.workflow_status != 'DRAFT':
        return Response({'error': 'Exam already submitted for approval or processed'}, status=400)

    exam.workflow_status = 'SUBMITTED'
    exam.save()

    create_audit_log(
    request.user,
    'CREATE_EXAM',
    f"Submitted exam for approval: {exam.exam_name}"
)

    return Response({'message': 'Submitted for admin approval'})


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
        created_by=user
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