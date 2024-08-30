// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {


    const runcodeblock = vscode.commands.registerCommand("mdexecutor.runcodeblock", () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const position = editor.selection.active;
        const line = editor.document.lineAt(position.line);
        vscode.window.showInformationMessage(`Running command linked to: ${line.text.trim()}`);
        // search starts from the current line and expand both upwards and downwards
        // it will search for ```bash and ``` and return the text (commands) in between.
        const commandtext = findBashBlock(editor.document,line.lineNumber);
        // console.log(commandtext);
        if (commandtext != null){
            let terminal = getExistingTerminal("mdexecutor");
            terminal = terminal ?? vscode.window.createTerminal('mdexecutor');
            terminal.show();
            terminal.sendText(commandtext);
        }
    }   
    }); 

    context.subscriptions.push(runcodeblock);
}




function findBashBlock(document: vscode.TextDocument, startLine: number): string | null {
    let topLine = startLine;
    let bottomLine = startLine;

    // Search upwards for the start of the block
    while (topLine >= 0) {
        const lineText = document.lineAt(topLine).text.trim();
        if (lineText.startsWith('```bash')) {
            break;
        }
        topLine--;
    }
    // If the start of the block wasn't found, return null
    if (topLine < 0 || !document.lineAt(topLine).text.trim().startsWith('```bash')) {
        return null;
    }
    topLine++; // next line of ```bash


    // Search downwards for the end of the block
    const totalLines = document.lineCount;
    while (bottomLine < totalLines) {
        const lineText = document.lineAt(bottomLine).text.trim();
        if (lineText === "```") {
            break;
        }
        bottomLine++;
    }
    // If the end of the block wasn't found, return null
    if (bottomLine >= totalLines || document.lineAt(bottomLine).text.trim() !== '```') {
        return null;
    }
    bottomLine--; // previous line of ```

    // Extract the text between the bash block markers
    const range = new vscode.Range(topLine, 0, bottomLine, document.lineAt(bottomLine).text.length);
    const bashBlock = document.getText(range);

    return bashBlock;
}

function getExistingTerminal(name: string): vscode.Terminal | undefined {
    // Iterate through all terminals to find one with the specified name
    for (const terminal of vscode.window.terminals) {
        if (terminal.name === name) {
            return terminal;
        }
    }
    return undefined;
}


// This method is called when your extension is deactivated
export function deactivate() {}
