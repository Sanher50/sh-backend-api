const express = require("express");

const quiz = require("./quiz");
const flashcards = require("./flashcards");
const codeExplainer = require("./codeExplainer");
const researchFinder = require("./researchFinder");
const interviewSimulator = require("./interviewSimulator");

const router = express.Router();

router.use("/quiz", quiz);
router.use("/flashcards", flashcards);
router.use("/code-explainer", codeExplainer);
router.use("/research-finder", researchFinder);
router.use("/interview-simulator", interviewSimulator);

module.exports = router;


