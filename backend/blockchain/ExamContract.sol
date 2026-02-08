// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ExamContract {

    address public admin;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    // =========================
    // EXAM STRUCT
    // =========================
    struct Exam {
        uint examId;
        bytes32 questionHash;
        uint startTime;
        uint endTime;
        bool exists;
    }

    mapping(uint => Exam) public exams;

    // =========================
    // RESULT STORAGE
    // =========================
    // examId => studentHash => resultHash
    mapping(uint => mapping(bytes32 => bytes32)) private results;

    // =========================
    // EXAM REGISTRATION
    // =========================
    function registerExam(
        uint _examId,
        bytes32 _questionHash,
        uint _startTime,
        uint _endTime
    ) public onlyAdmin {
        exams[_examId] = Exam(
            _examId,
            _questionHash,
            _startTime,
            _endTime,
            true
        );
    }

    function getExam(uint _examId)
        public
        view
        returns (bytes32, uint, uint)
    {
        require(exams[_examId].exists, "Exam not found");
        return (
            exams[_examId].questionHash,
            exams[_examId].startTime,
            exams[_examId].endTime
        );
    }

    // =========================
    // RESULT COMMIT
    // =========================
    function commitResult(
        uint _examId,
        bytes32 _studentHash,
        bytes32 _resultHash
    ) public onlyAdmin {
        require(exams[_examId].exists, "Exam not found");
        require(results[_examId][_studentHash] == bytes32(0),
            "Result already committed");

        results[_examId][_studentHash] = _resultHash;
    }

    function getResult(
        uint _examId,
        bytes32 _studentHash
    ) public view returns (bytes32) {
        return results[_examId][_studentHash];
    }
}
