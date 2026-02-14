from datetime import datetime, timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
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
    Question
)

from .blockchain import contract, web3


User = get_user_model()

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
    now = timezone.now().time()
    if now < exam.start_time:
        return Response({'error': 'Exam has not started yet'}, status=403)

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
    print("QUESTION COUNT:", questions.count())

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

    qp.blockchain_tx_hash = tx_hash.hex()
    qp.is_locked = True
    qp.save()

    print("QP HASH:", qp.question_hash)

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

    # 🔐 Only ADMIN can verify results
    if user.role != 'ADMIN':
        return Response(
            {'error': 'Only admin can verify results'},
            status=403
        )

    # 1️⃣ Fetch exam
    try:
        exam = Exam.objects.get(id=exam_id)
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)

    # 2️⃣ Fetch student
    try:
        student = User.objects.get(id=student_id, role='STUDENT')
    except User.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)

    # 3️⃣ Fetch StudentExam
    try:
        student_exam = StudentExam.objects.get(
            exam=exam,
            student=student
        )
    except StudentExam.DoesNotExist:
        return Response({'error': 'Student has not attempted this exam'}, status=404)

    # 4️⃣ Fetch Result
    try:
        result = Result.objects.get(student_exam=student_exam)
    except Result.DoesNotExist:
        return Response({'error': 'Result not found'}, status=404)

    # 5️⃣ Rebuild result hash (LOCAL)
    result_string = (
        f"{exam.id}|{student.id}|{result.score}|"
        f"{student_exam.end_time.isoformat()}"
    )
    local_hash = hashlib.sha256(result_string.encode()).hexdigest()

    # 6️⃣ Compare hashes
    if local_hash == result.result_hash:
        return Response({
            'status': 'VERIFIED',
            'message': 'Result integrity verified. No tampering detected.',
            'score': result.score
        })
    else:
        return Response({
            'status': 'TAMPERED',
            'message': 'Result mismatch detected! Possible tampering.',
            'score': result.score
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

        # Student-specific status
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
def login_user(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if user is None:
        return Response({"error": "Invalid credentials"}, status=400)

    token, created = Token.objects.get_or_create(user=user)

    return Response({
        "token": token.key,
        "role": user.role
    })

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        token = Token.objects.get(key=response.data['token'])
        user = token.user

        return Response({
            'token': token.key,
            'role': user.role
        })
