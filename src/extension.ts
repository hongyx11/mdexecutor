// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const bashCommandsMap = new Map<string, { command: string, dependencies: string[] }>();
    const runcodeblock = vscode.commands.registerCommand("mdexecutor.runcodeblock", () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const position = editor.selection.active;
        const line = editor.document.lineAt(position.line);
        // vscode.window.showInformationMessage(`Running command linked to: ${line.text.trim()}`);
        // search starts from the current line and expand both upwards and downwards
        // it will search for ```bash and ``` and return the text (commands) in between.
        const commandtext = findBashBlock(editor.document,line.lineNumber);
        // console.log(commandtext);
        if(commandtext == null) return;
        

        if (commandtext != null){
            let terminal = getExistingTerminal("mdexecutor");
            terminal = terminal ?? vscode.window.createTerminal('mdexecutor');
            terminal.show();
            // Extract dependencies
            const dependencies: string[] = [];
            const depMatches = commandtext.matchAll(/#dep\s+(\S+)/g);
            for (const depMatch of depMatches) {
                const dep = depMatch[1];
                if (bashCommandsMap.has(dep)) {
                    const depCommand = bashCommandsMap.get(dep)?.command;
                    if (depCommand) {
                        terminal.sendText(depCommand);
                    }
                } else {
                    vscode.window.showWarningMessage(`Dependency "${dep}" not found.`);
                }
            }
            terminal.sendText(commandtext);
        }
    }   
    }); 

    const updatebashcode = vscode.commands.registerCommand("mdexecutor.updateworkflow", () => {
        const activeEditor = vscode.window.activeTextEditor;
        if(activeEditor == null) return;
        const document = activeEditor.document;
        console.log("we are saveing a file");
        if (document.languageId === 'markdown') {
            console.log("we are processing a markdown file");
            const extractedCommands = extractBashCommands(document);
            for (const [jobName, command] of extractedCommands) {
                bashCommandsMap.set(jobName, command);
            }

            // Optional: log the results or perform additional actions
            console.log('Bash commands saved:', bashCommandsMap);
        }
    });    

    context.subscriptions.push(
        runcodeblock, 
        updatebashcode
    );
}


function extractBashCommands(document: vscode.TextDocument): Map<string, { command: string, dependencies: string[] }> {
    const commandsMap = new Map<string, { command: string, dependencies: string[] }>();
    const text = document.getText();
    const bashBlockRegex = /```bash([\s\S]*?)```/g;

    let match;
    while ((match = bashBlockRegex.exec(text)) !== null) {
        let bashCommand = match[1].trim();

        // Extract job name
        const jobNameMatch = bashCommand.match(/#jobname\s+(\S+)/);
        if (!jobNameMatch) {
            continue; // If no job name, skip this block
        }
        const jobName = jobNameMatch[1];

        // Extract dependencies
        const dependencies: string[] = [];
        const depMatches = [...bashCommand.matchAll(/#dep\s+(\S+)/g)];
        for (const depMatch of depMatches) {
            dependencies.push(depMatch[1]);
        }
        
        // Remove #jobname line from the bash command
        bashCommand = bashCommand.replace(/#jobname\s+\S+/, '').trim();
        // Remove all #dep lines from the bash command
        bashCommand = bashCommand.replace(/#dep\s+\S+/g, '').trim();
        // Store the command and its dependencies in the map
        commandsMap.set(jobName, {
            command: bashCommand,
            dependencies: dependencies
        });
    }

    return commandsMap;
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
