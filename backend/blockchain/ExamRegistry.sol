// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ExamRegistry {

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    struct Exam {
        bytes32 questionsHash;
        uint256 startTime;
        uint256 endTime;
        bool exists;
    }

    mapping(uint256 => Exam) public exams;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    function registerExam(
        uint256 examId,
        bytes32 questionsHash,
        uint256 startTime,
        uint256 endTime
    ) public onlyOwner {

        require(!exams[examId].exists, "Exam already registered");

        exams[examId] = Exam(
            questionsHash,
            startTime,
            endTime,
            true
        );
    }

    function getExam(uint256 examId)
        public
        view
        returns (bytes32, uint256, uint256)
    {
        require(exams[examId].exists, "Exam not found");

        Exam memory e = exams[examId];
        return (e.questionsHash, e.startTime, e.endTime);
    }
}
