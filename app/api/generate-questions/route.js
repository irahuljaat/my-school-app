import { NextResponse } from "next/server";
import OpenAI from "openai";
import { extractText } from "unpdf";

export const runtime = "nodejs";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("pdfs");

    let combinedText = "";
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await extractText(arrayBuffer);
      combinedText += Array.isArray(pdf.text) ? pdf.text.join("\n") : pdf.text || "";
    }

    const sections = [
      { id: "mcq", label: "SECTION A: MCQs" },
      { id: "tickCorrect", label: "SECTION B: TICK THE CORRECT OPTION" },
      { id: "fillBlanks", label: "SECTION C: FILL IN THE BLANKS" },
      { id: "trueFalse", label: "SECTION D: TRUE / FALSE" },
      { id: "veryShort", label: "SECTION E: VERY SHORT ANSWER QUESTIONS" },
      { id: "short", label: "SECTION F: SHORT ANSWER QUESTIONS" },
      { id: "long", label: "SECTION G: LONG ANSWER QUESTIONS" }
    ];

    let structurePrompt = "";
    sections.forEach(s => {
      if (formData.get(s.id) === "true") {
        const count = formData.get(`${s.id}Count`);
        const marksEach = formData.get(`${s.id}Marks`);
        const total = parseInt(count) * parseInt(marksEach);
        structurePrompt += `- ${s.label} [Total Marks: ${total}] (${count} Questions)\n`;
      }
    });

  

const prompt = `
    You are an expert examiner for MVG Public School. 
    Generate a professional exam paper using the following strictly enforced spacing rules:

    SPACING & FORMATTING RULES:
    1. MCQs:
       - Place the question on its own line.
       - Place all four options (A), (B), (C), (D) on the IMMEDIATELY FOLLOWING line with equal spacing.
       - Example:
         1. What is the capital of India?
         (A) Jaipur  (B) Mumbai  (C) New Delhi  (D) Chennai

    2. TICK CORRECT / TRUE-FALSE:
       - Place a single space and then an empty bracket [ ] at the end of each question text.
       - Example: 1. The sun rises in the east. [ ]

    3. SECTION HEADERS:
       - Format as: SECTION [Letter]: [Title] [Total Marks]
       - Add one empty line BEFORE and AFTER each section header.

    4. QUANTITY:
       - Match these exact counts: ${structurePrompt}

    5. OUTPUT: 
       - Return a JSON object with "paper" and "answers" strings.
  `;

  // Use a capable model to ensure strict adherence to counts and spacing
  const completion = await client.chat.completions.create({
    model: "openai/gpt-4o-mini", 
    messages: [{ role: "user", content: prompt + "\n\nSource: " + combinedText.slice(0, 12000) }],
    response_format: { type: "json_object" }
  });

    const result = JSON.parse(completion.choices[0].message.content);

    // FIX: Ensure result.paper is a string, not an object
    const finalPaper = typeof result.paper === 'object' 
      ? Object.entries(result.paper).map(([k, v]) => `${k}\n${v}`).join('\n\n') 
      : result.paper;

    const finalAnswers = typeof result.answers === 'object' 
      ? Object.entries(result.answers).map(([k, v]) => `${k}\n${v}`).join('\n\n') 
      : result.answers;

    return NextResponse.json({ 
      success: true, 
      paper: finalPaper || "No paper generated.", 
      answers: finalAnswers || "No answers generated." 
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}