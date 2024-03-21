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
    let final: string = `
	{
		"Name": {
			"prefix": ["..."],
			"body": [
				${snippetText
                    .split("\n")
                    .map((d, index, array) => {
                        let rawStr = d.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\t/g, "\\t").replace(/"/g, '\\"');
                        let comma = index === array.length - 1 ? "" : ",";
                        return `"${rawStr}"${comma}`;
                    })
                    .join("\n")}
			],
			"description": "..."
		}
	}	
	`;

    return prettier.format(final, { parser: "json", tabWidth: indentTabWidth, useTabs: indentUseTabs });
}
