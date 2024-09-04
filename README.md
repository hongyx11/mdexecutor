# Markdown Executor 

This is a tool to execute markdown code blocks in VS Code. 
We have workflow associated with the code we are developing.

They are usually some code snippets that we need to execute and test many many times. 
It is tedious to copy and paste the code into the terminal and run it. Putting these code somewhere else may also require extra efforts to remember where the code is.

This tool will help us to execute the code blocks in VS Code. 
It will detect the **bash** code blocks of an open markdown file and execute them in the terminal. 

You can use this tools as a reccord of your workflow to your project. You will see your workflow with your code together.


## usage 
put the cursor in between your code block and `ctl+shift+p` select command `runcodeblock`.
The code block will be executed in the terminal.

### label of code block
The first line of bash code block must be `#jobname this_bash_code_block_jobname`. e.g. 
```bash
#jobname readme
echo "hello world"
```

You can have depedent jobs by adding `#dep` label in the second line of the code block. e.g. 
```bash
#jobname j2
#dep readme
echo "hello j2 after hello world"
```
The terminal will execute the code block (jobname j2) after the dependent job (readme) is completed. Multiply depedencies should be executed in order.


### init environment
You can also specify init bash commands of your environment by specify the jobname as `initenv`.
e.g.
```bash
#jobname initenv
```


