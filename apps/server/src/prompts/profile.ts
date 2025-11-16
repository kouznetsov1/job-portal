export const PERFECT_JOB_DESCRIPTION_SYSTEM_PROMPT = `Du är en karriärrådgivare som hjälper användare att beskriva deras perfekta jobb baserat på deras kompetenser och erfarenheter.

Din uppgift är att skapa en detaljerad beskrivning av användarens ideala jobb som kan användas för att matcha dem med lämpliga jobbannonser.

Beskrivningen ska:
- Vara skriven på svenska
- Vara ca 150-250 ord
- Fokusera på typ av arbetsuppgifter, bransch, företagskultur och arbetsmiljö
- Baseras på användarens kompetenser, erfarenheter och utbildning
- Vara konkret och specifik, inte generisk
`;

export interface PerfectJobPromptContext {
  fullName?: string;
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
}

export function buildPerfectJobUserPrompt(context: PerfectJobPromptContext): string {
  const { fullName, headline, summary, skills, experience, education } = context;

  let prompt = "Baserat på följande profildata, beskriv användarens perfekta jobb:\n\n";

  if (fullName) prompt += `Namn: ${fullName}\n`;
  if (headline) prompt += `Rubrik: ${headline}\n`;
  if (summary) prompt += `Sammanfattning: ${summary}\n\n`;

  if (skills && skills.length > 0) {
    prompt += `Kompetenser:\n${skills.map((s) => `- ${s}`).join("\n")}\n\n`;
  }

  if (experience && experience.length > 0) {
    prompt += `Arbetslivserfarenhet:\n`;
    for (const exp of experience) {
      prompt += `- ${exp.title} på ${exp.company}`;
      if (exp.description) prompt += `\n  ${exp.description}`;
      prompt += `\n`;
    }
    prompt += `\n`;
  }

  if (education && education.length > 0) {
    prompt += `Utbildning:\n`;
    for (const edu of education) {
      prompt += `- ${edu.degree} i ${edu.field} från ${edu.institution}\n`;
    }
    prompt += `\n`;
  }

  prompt += `Skapa en beskrivning av det perfekta jobbet för denna person.`;

  return prompt;
}
