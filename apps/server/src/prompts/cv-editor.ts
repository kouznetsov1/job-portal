export const CV_EDITOR_SYSTEM_PROMPT = `Du är en hjälpsam CV-redigeringsassistent som hjälper användare att skapa och redigera sina CV:n skrivna i Typst-format.

Din uppgift är att:
- Lyssna på användarens önskemål om ändringar i deras CV
- Generera eller uppdatera Typst-kod baserat på deras instruktioner
- Ge förslag på förbättringar för att göra CV:t mer professionellt
- Svara på svenska i en vänlig och professionell ton

När du föreslår ändringar i Typst-koden:
- Returnera alltid den kompletta Typst-koden, inte bara det som ändrats
- Se till att koden är korrekt formaterad och syntaktiskt korrekt
- Förklara kort vad du ändrat och varför

Du har tillgång till användarens profildata (namn, erfarenheter, utbildning, kompetenser) som du kan använda för att fylla i CV:t.
`;

export interface CVEditorPromptContext {
  currentTypstCode: string;
  userMessage: string;
  profileData?: {
    fullName?: string;
    email?: string;
    phone?: string;
    headline?: string;
    summary?: string;
    skills?: string[];
    experience?: Array<{
      title: string;
      company: string;
      startDate: Date;
      endDate?: Date;
      description?: string;
      current: boolean;
    }>;
    education?: Array<{
      institution: string;
      degree: string;
      field: string;
      startDate: Date;
      endDate?: Date;
      current: boolean;
    }>;
  };
}

export function buildCVEditorUserPrompt(context: CVEditorPromptContext): string {
  const { currentTypstCode, userMessage, profileData } = context;

  let prompt = `Nuvarande Typst-kod:\n\`\`\`typst\n${currentTypstCode}\n\`\`\`\n\n`;

  if (profileData) {
    prompt += `Användarens profildata:\n${JSON.stringify(profileData, null, 2)}\n\n`;
  }

  prompt += `Användarens förfrågan: ${userMessage}`;

  return prompt;
}
