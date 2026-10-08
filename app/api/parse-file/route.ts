import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { extractedFileSchema } from "@/lib/schemas";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB

function cleanExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "No file was uploaded.",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          error: "The uploaded file is empty.",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "File is too large. Maximum supported size is 8 MB.",
        },
        {
          status: 413,
        }
      );
    }

    const filename = file.name.toLowerCase();

    const extension = filename.split(".").pop();

    if (!extension || !["pdf", "docx", "txt"].includes(extension)) {
      return NextResponse.json(
        {
          error: "Unsupported file type. Upload PDF, DOCX, or TXT.",
        },
        {
          status: 400,
        }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // IMPORTANT:
    // Keep this variable outside all file-type conditions.
    let extractedText = "";

    // PDF
 if (extension === "pdf") {
  const result = await pdfParse(buffer);
  extractedText = result.text;
}

    // DOCX
    if (extension === "docx") {
      const result = await mammoth.extractRawText({
        buffer,
      });

      extractedText = result.value;
    }

    // TXT
    if (extension === "txt") {
      extractedText = buffer.toString("utf-8");
    }

    extractedText = cleanExtractedText(extractedText);

    if (!extractedText) {
      return NextResponse.json(
        {
          error: "No readable text was found in the file.",
        },
        {
          status: 422,
        }
      );
    }

    const parsed = extractedFileSchema.parse({
      filename: file.name,
      fileType: extension,
      text: extractedText,
      characterCount: extractedText.length,
    });

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("File parsing error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to parse the uploaded file.",
      },
      {
        status: 500,
      }
    );
  }
}