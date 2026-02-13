from django.urls import path
from .views import (
    start_exam,
    fetch_question_paper,
    submit_exam,
    create_question_paper,
    lock_question_paper,
    verify_question_paper,
    verify_result,
    student_my_result,
    list_exams,
    login_user,
    CustomAuthToken,
)

urlpatterns = [

    # -------------------------
    # STUDENT APIs
    # -------------------------
    path('exams/', list_exams),
    path('exams/<int:exam_id>/start/', start_exam),
    path('exams/<int:exam_id>/questions/', fetch_question_paper),
    path('exams/<int:exam_id>/submit/', submit_exam),

    # -------------------------
    # STAFF APIs
    # -------------------------
    path('exams/<int:exam_id>/create-paper/', create_question_paper),
    path('exams/<int:exam_id>/lock/', lock_question_paper),

    # -------------------------
    # ADMIN APIs
    # -------------------------
    path('exams/<int:exam_id>/verify/', verify_question_paper),
    path('exams/<int:exam_id>/results/<int:student_id>/verify/',verify_result),
    path('exams/<int:exam_id>/my-result/',student_my_result),
    path('login/', login_user),
    path('api-token-auth/', CustomAuthToken.as_view()),


]
