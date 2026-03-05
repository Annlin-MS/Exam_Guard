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
    submit_for_approval,
    approve_exam,
    list_staff,
    list_students,
    enroll_students,
    admin_dashboard_stats,
    view_audit_logs,
    create_question,
    blockchain_status,
    create_exam,
    list_questions,
    list_pending_questions,
    approve_question,
    reject_question,
    staff_exam_results,
    student_my_result,
    admin_list_results,
    publish_results,
    verify_result_hash,
    enroll_students,
    get_notifications,

)

urlpatterns = [
    path('notifications/', get_notifications),

    # -------------------------
    # STUDENT APIs
    # -------------------------
    path('exams/', list_exams),
    path('exams/<int:exam_id>/start/', start_exam),
    path('exams/<int:exam_id>/questions/', fetch_question_paper),
    path('exams/<int:exam_id>/submit/', submit_exam),
    path('exams/<int:exam_id>/my-result/', student_my_result),

    # -------------------------
    # STAFF APIs
    # -------------------------
    path('exams/<int:exam_id>/create-paper/', create_question_paper),
    path('exams/<int:exam_id>/lock/', lock_question_paper),
    path('exams/<int:exam_id>/staff-results/', staff_exam_results),
    # -------------------------
    # ADMIN APIs
    # -------------------------
    path('exams/<int:exam_id>/verify/', verify_question_paper),
    path('exams/<int:exam_id>/results/<int:student_id>/verify/',verify_result),
    path('exams/<int:exam_id>/my-result/',student_my_result),
    path('login/', login_user),
    path('exams/<int:exam_id>/submit-for-approval/', submit_for_approval),
    path('exams/<int:exam_id>/approve/', approve_exam),
        # -------------------------
    # ADMIN MANAGEMENT APIs
    # -------------------------
    path('admin/staff/', list_staff),
    path('admin/students/', list_students),
    path('admin/exams/<int:exam_id>/enroll/', enroll_students),
    path('admin/dashboard-stats/', admin_dashboard_stats),
    path('admin/audit-logs/', view_audit_logs),
    path('exams/<int:exam_id>/add-question/', create_question),
    path('admin/blockchain-status/', blockchain_status),
    path('exams/create/', create_exam),
    path('exams/<int:exam_id>/questions/list/', list_questions),
    path('admin/questions/', list_pending_questions),
    path('admin/questions/<int:question_id>/approve/', approve_question),
    path('admin/questions/<int:question_id>/reject/', reject_question),
    path('admin/results/', admin_list_results),
    path('admin/results/<int:exam_id>/publish/', publish_results),
    path('admin/results/<int:exam_id>/verify-hash/', verify_result_hash),
    path('exams/<int:exam_id>/enroll/', enroll_students),
    
    
]
