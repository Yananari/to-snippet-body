import * as vscode from "vscode";
import * as prettier from "prettier";

// =============== Activate =============== //

export function activate(context: vscode.ExtensionContext) {
    console.log(`${context.extension.id} is starting...`);

    let disposable = vscode.commands.registerCommand("to-snippet-body.convert", async () => {
        createSnippet();
    });

    context.subscriptions.push(disposable);
}

// =============== Deactivate =============== //

export function deactivate() {}

// =============== Functions =============== //

/**
 * Creates snippet from selected text in editor.
 */
async function createSnippet() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    // Editor Selection
    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);

    // Editor Settings
    const indentTabWidth = editor.options.tabSize as number;
    const indentUseTabs = editor.options.insertSpaces ? false : true;

    // Getting Formatted Snippet
    const snippetBody = await convertToSnippet(selectedText, indentTabWidth, indentUseTabs);

    // Creating new unsaved document containing created snippet
    vscode.workspace.openTextDocument({ language: "json", content: snippetBody }).then((doc) => {
        vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Active, preserveFocus: true });
    });
}

/**
 * Converts provided text to vscode snippet format.
 */
function convertToSnippet(snippetText: string, indentTabWidth: number, indentUseTabs: boolean): Promise<string> {
    return new Promise((resolve, reject) => {
        let tabRegex = new RegExp(`^\\t+`, "gm");
        let spaceRegex = new RegExp(`^(\\s{${indentTabWidth}})+`, "gm");

        let final: string = `
        {
            "Name": {
                "prefix": ["..."],
                "body": [
                    ${snippetText
                        .split("\n")
                        .map((line, index, array) => {
                            let rawStr = line.replace(new RegExp(tabRegex, "g"), "\t"); // Tab Indents
                            rawStr = rawStr.replace(spaceRegex, (match) => `\t`.repeat(match.length / indentTabWidth)); // Space Indents
                            rawStr = escapeString(rawStr);
                            let comma = index === array.length - 1 ? "" : ",";
                            return `"${rawStr}"${comma}`;
                        })
                        .join("\n")}
                ],
                "description": "..."
            }
        }	
        `;

        prettier
            .format(final, { parser: "json", tabWidth: indentTabWidth, useTabs: indentUseTabs })
            .then((formatted: string) => {
                resolve(formatted);
            })
            .catch((error) => {
                console.error(error);
                vscode.window.showErrorMessage("Invalid indext settings! Please fix your settings and try again.");
                resolve(final);
            });
    });
}

function escapeString(input: string): string {
    let result = "";
    for (let i = 0; i < input.length; i++) {
        const char = input.charAt(i);
        switch (char) {
            case "\n":
                result += "\\n";
                break;
            case "\r":
                result += "\\r";
                break;
            case "\t":
                result += "\\t";
                break;
            case "\v":
                result += "\\v";
                break;
            case "\b":
                result += "\\b";
                break;
            case "\f":
                result += "\\f";
                break;
            case "\0":
                result += "\\0";
                break;
            case "'":
                result += "\\'";
                break;
            case '"':
                result += '\\"';
                break;
            case "\\":
                result += "\\\\";
                break;
            default:
                result += char;
                break;
        }
    }
    return result;
}
