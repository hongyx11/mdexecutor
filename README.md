---
header-includes:
  - \usepackage[ruled,vlined,linesnumbered]{algorithm2e}
---
# Algorithm 1
Just a sample algorithmn
\begin{algorithm}[H]
\DontPrintSemicolon
\SetAlgoLined
\KwResult{Write here the result}
\SetKwInOut{Input}{Input}\SetKwInOut{Output}{Output}
\Input{Write here the input}
\Output{Write here the output}
\BlankLine
\While{While condition}{
    instructions\;
    \eIf{condition}{
        instructions1\;
        instructions2\;
    }{
        instructions3\;
    }
}
\caption{first algorithm}
\label{algo:algo1}
\end{algorithm} 



helo Algorithm \ref{algo:algo1}


# mdexecutor 


hello world



## package 
```bash
vsce package 
```

## install package 
```bash

```

```{.algorithm}
\begin{algorithmic}
\STATE \textbf{Input:} $x$
\STATE \textbf{Output:} $y$
\STATE $y \leftarrow x + 1$
\STATE \textbf{Return} $y$
\end{algorithmic}

## git operation
```bash
#jobname gitupload
cd /Users/hongy0a/Documents/CodeOnMac/mdexecutor && \
git add . && git commit -m "remove warning" && git push && \
cd - 
```




