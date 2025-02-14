import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { registerHelpers } from "./helpers";

// Register any custom helpers
registerHelpers();

// Register a helper to wrap code in triple backticks for proper markdown formatting
Handlebars.registerHelper("codeBlock", function(code: string, language: string = "javascript") {
  if (!code) return "";
  return new Handlebars.SafeString("```" + language + "\n" + code + "\n```");
});

/**
 * Renders a Handlebars template with the provided data.
 *
 * @param template - The template string to render.
 * @param data - The data to inject into the template.
 * @returns The rendered template string.
 */
export function renderTemplate(template: string, data: any): string {
    const compiledTemplate = Handlebars.compile(template);
    return compiledTemplate(data);
}

export function templateEngine(payload: any): string {
  // Load the default Handlebars template from the templates folder
  const templatePath = path.join(__dirname, "..", "templates", "default.hbs");
  const templateContent = fs.readFileSync(templatePath, "utf-8");
  
  // Compile the template
  const template = Handlebars.compile(templateContent);
  
  // Render the documentation using the provided payload (analysis results, etc.)
  return template(payload);
}

// New function to compile the default template with a provided context
export function compileTemplate(context: any): string {
  const templatePath = path.join(__dirname, '../../templates/default.hbs');
  const templateContent = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateContent);
  return template(context);
} 