"use server";

import { db } from "../../app/firebase/config"; 
import { collection, addDoc } from "firebase/firestore";

export async function processAndSavePdf(formData) {
  // 1. Import the whole module
  const pdfModule = require("pdf-parse");
  
  // 2. Identify the actual function
  // In some environments it's the module itself, in others it's .default
  const parsePdf = typeof pdfModule === 'function' ? pdfModule : pdfModule.default;

  const className = formData.get("className");
  const chapterName = formData.get("chapterName");
  const files = formData.getAll("pdfs");

  console.log(`🚀 Starting processing for Class: ${className}`);
  const results = [];

  for (const file of files) {
    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // 3. Use the identified function
      if (!parsePdf) {
        throw new Error("PDF parser function not found in module.");
      }

      const pdfData = await parsePdf(buffer);
      const extractedText = pdfData.text;

      const docRef = await addDoc(collection(db, "chapters"), {
        className,
        chapterName,
        fileName: file.name,
        content: extractedText,
        uploadDate: new Date().toISOString(),
      });

      console.log(`✅ Saved ${file.name} (ID: ${docRef.id})`);
      results.push({ name: file.name, id: docRef.id });

    } catch (err) {
      console.error(`❌ Error processing ${file.name}:`, err.message);
    }
  }

  return { success: results.length > 0, filesProcessed: results };
}