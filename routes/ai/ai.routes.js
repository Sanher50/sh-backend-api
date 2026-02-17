import express from "express";

import quiz from "./quiz.js";
import flashcards from "./flashcards.js";
import codeExplainer from "./codeExplainer.js";
import researchFinder from "./researchFinder.js";
import interviewSimulator from "./interviewSimulator.js";

const router = express.Router();

router.use("/quiz", quiz);
router.use("/flashcards", flashcards);
router.use("/code-explainer", codeExplainer);
router.use("/research-finder", researchFinder);
router.use("/interview-simulator", interviewSimulator);

export default router;

