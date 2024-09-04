// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { CompressionStream } from 'stream/web';
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "your-extension-name" is now active!');
    const bashCommandsMap = new Map<string, { command: string, dependencies: string[] }>();
    // 
    let initenved = false;

    const runcodeblock = vscode.commands.registerCommand("mdexecutor.runcodeblock", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            if(!initenved){
                vscode.commands.executeCommand("mdexecutor.mdinit");
                initenved = true;
            }
            const extractedCommands = ExtractAllBashBlocks(editor.document);
            for (const [jobName, command] of extractedCommands) {
                bashCommandsMap.set(jobName, command);
            }
            const position = editor.selection.active;
            const line = editor.document.lineAt(position.line);
            // vscode.window.showInformationMessage(`Running command linked to: ${line.text.trim()}`);
            // search starts from the current line and expand both upwards and downwards
            // it will search for ```bash and ``` and return the text (commands) in between.
            let commandtext = findBashBlock(editor.document,line.lineNumber);
            // get current jobname
            const jobname = ExtractJobName(commandtext);
            if(jobname == null){
                return;
            }
            // show terminal 
            let terminal = getExistingTerminal("mdexecutor");
            terminal = terminal ?? vscode.window.createTerminal('mdexecutor');
            terminal.show();
            // console.log(bashCommandsMap)
            for (const depMatch of bashCommandsMap.get(jobname)?.dependencies ?? []) {
                if (bashCommandsMap.has(depMatch)) {
                    // console.log("dep and bashcommands", depMatch, bashCommandsMap.get(depMatch));
                    const depCommand = bashCommandsMap.get(depMatch)?.command;
                    if (depCommand) {
                        terminal.sendText(depCommand);
                    }
                } else {
                    vscode.window.showWarningMessage(`Dependency "${depMatch}" not found.`);
                }
            }
            terminal.sendText(bashCommandsMap.get(jobname)?.command ?? "");
        }
        }); 
    
        const mdinit = vscode.commands.registerCommand("mdexecutor.mdinit", () => {
            // console.log("call_mdinit");
            const activeEditor = vscode.window.activeTextEditor;

            if (!activeEditor){
                console.log("no active editor");
                return;
            }
            const document = activeEditor.document;
            // console.log(document.languageId);
            if(document.languageId !== 'markdown'){
                return ;
            }
            const extractedCommands = ExtractAllBashBlocks(document);
            for (const [jobName, command] of extractedCommands) {
                bashCommandsMap.set(jobName, command);
            }
            if(bashCommandsMap.has('initenv') && initenved == false){
                let terminal = getExistingTerminal("mdexecutor");
                terminal = terminal ?? vscode.window.createTerminal('mdexecutor');
                terminal.show();
                const tmp = bashCommandsMap.get('initenv');
                if(tmp == null){
                    return;
                }
                terminal.sendText(tmp.command);
                initenved = true;
            }
        });
    

    // // Trigger when a text document is opened
    // vscode.workspace.onDidChangeTextDocument(() => {
    //     const editor = vscode.window.activeTextEditor;
    //     if(!editor) return;
    //     // if I'm in a bash code block, trigger mdinit
    //     if(InBashBlock(editor.document, editor.selection.active.line)) {
    //         vscode.commands.executeCommand("mdexecutor.mdinit");
    //     }else{
    //     }
    // });



    context.subscriptions.push(
        runcodeblock, 
        mdinit
    );
}

function ExtractJobName(bashcommand: string | null)
{
    if(bashcommand == null){
        return null;
    }
    // Extract job name
    const jobNameMatch = bashcommand.match(/#jobname\s+(\S+)/);
    if (!jobNameMatch) {
        return null;
    }
    const jobName = jobNameMatch[1];
    return jobName;
}

// Extract all bash blocks from current markdown file
function ExtractAllBashBlocks(document: vscode.TextDocument): Map<string, { command: string, dependencies: string[] }> {
    const commandsMap = new Map<string, { command: string, dependencies: string[] }>();
    const text = document.getText();
    const bashBlockRegex = /```bash([\s\S]*?)```/g;

    let match;
    while ((match = bashBlockRegex.exec(text)) !== null) {
        let bashCommand = match[1].trim();

        // Extract job name
        let jobname = ExtractJobName(bashCommand);
        if(jobname === null){
            continue;
        }

        // Extract dependencies
        const depMatches = bashCommand.match(/#dep\s+(.+)/);
        const depsArray = depMatches ? depMatches[1].split(/\s+/) : [];
        
        const cleanedCommand = bashCommand.replace(/^\s*#.*(\n)?/gm, '');
        // Store the command and its dependencies in the map
        console.log(commandsMap);
        commandsMap.set(jobname, {
            command: cleanedCommand,
            dependencies: depsArray
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
