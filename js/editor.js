/* the main editor */

class editor
{
    constructor(cnvsid,edversion)
    {
        this.keypressRemap=[[190,'.',':'],[32,' ',' '],[219,'\'','?'],
            [188,',',';'],[187,'+','*'],[220,'\\','|'],[189,'-','_'],
            [226,'<','>'],
            [48,'0','='],[49,'1','!'],[50,'2','"'],[51,'3','£'],[52,'4','$'],[53,'5','%'],
            [54,'6','&'],[55,'7','/'],[56,'8','('],[57,'9',')']
        ];

        this.cnvsid=cnvsid;
        this.edVersion=edversion;
        this.fontManager=new fontmgr(cnvsid);

        this.lineArray=[];
        
        this.cursory=0;
        this.cursorx=0;
        this.cursorTick=0;
        this.cursorSteps=64;
        
        this.docTopline=0;
        
        this.numTotColumns=60;
        this.numColumns=this.numTotColumns-2;
        this.numRows=22;

        this.editorMode=0; // 0 - inserting text, 1 - command mode

        this.copyBuffer="";
        this.dragging=false;
        this.dragstartx=0;
        this.dragstarty=0;
        this.dragendx=0;
        this.dragendy=0;

        // resize canvas basing on columns/rows width

        var cnvsWidth=(this.numTotColumns*this.fontManager.fontwidth)+(this.numTotColumns*this.fontManager.multiplier)+2;
        var cnvsHeight=this.numRows*this.fontManager.fontheight+6;

        document.getElementById(this.cnvsid).width=cnvsWidth;
        document.getElementById(this.cnvsid).height=cnvsHeight;

        // init some object that will be usefull later

        this.scrollBar=new scrollbar(cnvsid,"arrowUp","arrowDown",this.fontManager.multiplier,this.fontManager.fontheight);
        this.statusBar=new statusbar(0,0,cnvsid,this.numRows,this.fontManager,this.numTotColumns);
        this.selection=new selection(cnvsid,this.numColumns,this.fontManager,this.lineArray);
        this.undoManager=new undomgr();

        // event handlers

        window.addEventListener('keydown', this.handleKeyPress.bind(this));
        window.addEventListener('dblclick', this.doubleClick.bind(this));
        window.addEventListener('mousedown', this.onmousedown.bind(this));
        window.addEventListener('mouseup', this.onmouseup.bind(this));
        window.addEventListener('mousemove', this.onmousemove.bind(this));
    }

    onmousedown(e)
    {
        this.selection.active=false;

        var x=e.pageX;
        var y=e.pageY;
        x-=document.getElementById(this.cnvsid).offsetLeft;
        y-=document.getElementById(this.cnvsid).offsetTop;

        var charCoord=this.fontManager.getCharCoord(x,y);

        this.dragging=true;
        this.dragstartx=charCoord[0];
        this.dragstarty=charCoord[1];

        if (this.dragstarty<this.lineArray.length)
        {
            if (this.dragstartx>this.lineArray[this.dragstarty].length)
            {
                this.dragstartx=this.lineArray[this.dragstarty].length-1;
            }
        }
    }

    onmouseup(e)
    {
        this.dragging=false;
    }

    onmousemove(e)
    {
        if (this.dragging)
        {
            var x=e.pageX;
            var y=e.pageY;
            x-=document.getElementById(this.cnvsid).offsetLeft;
            y-=document.getElementById(this.cnvsid).offsetTop;
    
            var charCoord=this.fontManager.getCharCoord(x,y);

            if (
                    ((charCoord[0]>this.dragstartx)&&(charCoord[1]>=this.dragstarty)) ||
                    ((charCoord[0]<this.dragstartx)&&(charCoord[1]>this.dragstarty))
            )
            {
                if (charCoord[1]<=this.lineArray.length)
                {
                    if (charCoord[0]>=this.lineArray[charCoord[1]].length)
                    {
                        charCoord[0]=this.lineArray[charCoord[1]].length-1;
                    }

                    this.selection.active=true;
                    this.selection.set(this.dragstartx,this.dragstarty,charCoord[0],charCoord[1]);
                }
            }
            else if (
                    ((charCoord[0]<this.dragstartx)&&(charCoord[1]<=this.dragstarty)) ||
                    ((charCoord[0]>this.dragstartx)&&(charCoord[1]<this.dragstarty))
            )
            {
                if (charCoord[1]<=this.lineArray.length)
                {
                    if (charCoord[0]>=this.lineArray[charCoord[1]].length)
                    {
                        charCoord[0]=this.lineArray[charCoord[1]].length-1;
                    }

                    this.selection.active=true;
                    this.selection.set(charCoord[0],charCoord[1],this.dragstartx,this.dragstarty);
                }
            }
        }
    }

    doubleClick(e)
    {
        // find word in that point and highlight it
        var x=e.pageX;
        var y=e.pageY;
        x-=document.getElementById(this.cnvsid).offsetLeft;
        y-=document.getElementById(this.cnvsid).offsetTop;

        var charCoord=this.fontManager.getCharCoord(x,y);

        this.highlightFromChar(charCoord);
    }

    isLetterOrNumber(str) 
    {
        return str.length === 1 && str.match(/[a-z0-9]/i);
    }    

    highlightWord(x,l)
    {
        var str=this.lineArray[l];
        var rightex,leftex;

        // find right/left extremes
        var xpos=x;
        var found=false;
        while (!found)
        {
            if ((xpos<str.length) && (this.isLetterOrNumber(str[xpos])))
            {
                xpos+=1;
            }
            else
            {
                found=true;
            }
        }
        rightex=xpos;
        if (rightex!=0) rightex-=1;

        xpos=x;
        found=false;
        while (!found)
        {
            if ((xpos>0) && (this.isLetterOrNumber(str[xpos])))
            {
                xpos-=1;
            }
            else
            {
                found=true;
            }
        }
        leftex=xpos;
        if (leftex!=0) leftex+=1;

        this.selection.active=true;
        this.selection.origx=leftex;
        this.selection.endx=rightex;
        this.selection.origline=l;
        this.selection.endline=l;
    }

    highlightFromChar(ccoord)
    {
        var line=ccoord[1];
        if (line>=this.lineArray.length)        
        {
            return;
        }

        var xpos=ccoord[0];
        if (xpos>=this.lineArray[line].length)
        {
            return;
        }

        this.highlightWord(xpos,line);
    }

    countWords()
    {
        var wc=0;
        var charsToRemove=[',',';','.',':','=','<','>'];

        for (var l=0;l<this.lineArray.length;l++)
        {
            var str=this.lineArray[l];
            for (var c of charsToRemove)
            {
                str=str.replace(c,'');
            }

            var arr=str.split(' ');
            for (var c=0;c<arr.length;c++)
            {
                if (arr[c].length>0) wc+=1;
            }
        }

        return wc;
    }

    download(filename, text) 
    {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);

        this.statusBar.setStatus("File downloaded.");
    }

    countChars()
    {
        var cc=0;
        this.lineArray.forEach(element => { for (const c of element) { cc++; } });
        return cc;
    }

    handleCommand(cmd)
    {
        if (cmd=="test")
        {
            this.lineArray=[];
            this.lineArray.push("A sample of text.");
            this.lineArray.push("The quick brown palomb jumped over the lazy tlc.");
            this.lineArray.push("<=ASCII-art=>");
            this.lineArray.push("");
            this.cursorx=0;
            this.cursory=3;
            return "Sample text uploaded."
        }
        else if (cmd=="wc")
        {
            // wordcount
            var wc=0;
            wc=this.countWords();
            return "Word count: "+wc.toString();
        }
        else if (cmd=="cc")
        {
            // char count
            var cc=0;
            cc=this.countChars();
            return "Char count: "+cc.toString();
        }
        else if ((cmd=="save")||(cmd=="s"))
        {
            // downloads the text in a .txt file
            var text="";
            this.lineArray.forEach(element => text+=element+'\n');
            this.download("mehd.txt",text);
            return "File saved.";
        }
        else if ((cmd=="clear")||(cmd=="cls"))
        {
            // wipes out your text
            this.lineArray=[];
            this.cursorx=0;
            this.cursory=0;
            return "Text wiped out.";
        }
        else if ((cmd=="ver")||(cmd=="v"))
        {
            return "Mehd version "+this.edVersion;
        }
        else
        {
            return "Unknown command";
        }

        return ""; // no cmd
    }

    copyCurrentSelection()
    {
        if (this.selection.active)
        {
            var copiedText="";
            var curx=this.selection.origx;
            var cury=this.selection.origline;

            var finished=false;
            while (!finished)
            {
                copiedText+=this.lineArray[cury][curx];
                curx++;

                if ((curx>this.selection.endx)&&(cury==this.selection.endline))
                {
                    finished=true;
                }
                else
                {
                    if (curx>=this.lineArray[cury].length)
                    {
                        copiedText+="\n";
                        curx=0;
                        cury+=1;
                    }                
                }
            }

            this.copyBuffer=copiedText;
            var summary=this.copyBuffer;
            if (summary.length>20)
            {
                summary=summary.substr(0,20)+"...";
            }

            this.statusBar.setStatus("Copied string '"+summary+"'");
        }    
    }

    cutCurrentSelection()
    {
        if (this.selection.active)
        {
            if (this.selection.origline==this.selection.endline)
            {
                var str=this.lineArray[this.selection.origline];
                var pre=str.substring(0,this.selection.origx);
                var post=str.substring(this.selection.endx+1);
                this.lineArray[this.selection.origline]=pre+post;
            }            
            else
            {
                var newLineArray=[];
                for (var l=0;l<this.lineArray.length;l++)
                {
                    if (l<this.selection.origline)
                    {
                        newLineArray.push(this.lineArray[l]);
                    }
                    else if (l==this.selection.origline)
                    {
                        newLineArray.push(this.lineArray[l].substring(0,this.selection.origx)+this.lineArray[this.selection.endline].substring(this.selection.endx+1));
                    }
                    else if (l>this.selection.endline)
                    {
                        newLineArray.push(this.lineArray[l]);
                    }
                }                

                this.lineArray=[];
                newLineArray.forEach(element => {
                    this.lineArray.push(element);
                });
            }

            this.selection.active=false;
        }        
    }

    handleCharCombo(code)
    {
        if (code==67) // CTRL-C
        {
            // copy (eventually) selected text
            this.copyCurrentSelection();                
        }
        else if (code==86) // CTRL-V
        {
            // paste what's in copybuffer
            if (this.copyBuffer!="")
            {
                this.lineArray[this.docTopline+this.cursory]+=this.copyBuffer;
                this.cursorx+=this.copyBuffer.length;                
            }
        }
        else if (code==88) // CTRL-X
        {
            // cut
            this.copyCurrentSelection();
            this.cutCurrentSelection();
        }
        else if (code==90) // CTRL-Z
        {
            // undo
            this.undoManager.undoLastAction(this);
        }
    }

    handleKeyPress(e)
    {
        if (e.keyCode==8)
        {
            // backspace
            this.selection.active=false;

            if (this.editorMode==0)
            {
                var ch=this.backSpace();
                if (ch!="")
                {
                    this.undoManager.backspace(ch,this);
                }
                e.preventDefault();
                return false;
            }
            else
            {
                this.statusBar.backSpace();
                e.preventDefault();
                return false;
            }
        }
        else if (e.keyCode==13)
        {
            // carriage return
            this.selection.active=false;

            if (this.editorMode==0)
            {
                this.cursory++;
                if (this.cursory==(this.numRows-1))
                {
                    this.cursory--;
                    this.docTopline+=1;
                }
                this.cursorx=0;
                this.lineArray.push("");
                this.undoManager.carriageReturn(this);
            }
            else
            {
                // process command
                var curCmd=this.statusBar.currentCommand;
                var retMsg=this.handleCommand(curCmd);

                // and go back to editor mode 0
                this.statusBar.resetCommand();
                this.statusBar.setOutputMessage(retMsg);
                this.statusBar.mode=2;
                this.editorMode=0;
            }
        }
        else if (e.keyCode==27)
        {
            // esc triggers command mode and back
            this.selection.active=false;

            if (this.editorMode==0) 
            {
                this.editorMode=1;
                this.statusBar.setMode(1);
            }
            else
            {
                this.editorMode=0;
                this.statusBar.setMode(0);
            }
        }
        else if (e.keyCode==38)
        {
            // todo: arrows
            // arrow up
            if (this.editorMode==0)
            {
                if (this.cursory==0)
                {
                    if (this.docTopline>0)
                    {
                        this.docTopline--;
                    }
                }
                else
                {
                    this.cursory--;
                }
            }
        }
        else
        {
            var charToAdd="";
            if ((e.keyCode>='A'.charCodeAt(0))&&(e.keyCode<='Z'.charCodeAt(0)))
            {
                if (e.ctrlKey)
                {
                    // handle special combinations (like ctrl-c, ctrl-v, etc.)
                    this.handleCharCombo(e.keyCode);
                }
                else
                {
                    var kc=e.keyCode;
                    if (!e.shiftKey) kc+=32;
                    charToAdd=String.fromCharCode(kc);
                    this.selection.active=false;
                }
            }
            else if ((e.keyCode>=48)&&(e.keyCode<=57)&&(!e.shiftKey))
            {
                var kc=e.keyCode;
                charToAdd=String.fromCharCode(kc);
                this.selection.active=false;
            }
            else
            {
                // try to remap the keycode
                for (var m=0;m<this.keypressRemap.length;m++)
                {
                    if (this.keypressRemap[m][0]==e.keyCode)
                    {
                        if (e.shiftKey)
                        {
                            charToAdd=this.keypressRemap[m][2];
                        }
                        else
                        {
                            charToAdd=this.keypressRemap[m][1];
                        }
                    }
                }
            }

            if (charToAdd!="")
            {
                if (this.editorMode==0)
                {
                    this.addChar(charToAdd);
                    this.undoManager.addChar(this.cursorx-1,this.cursory);
                    this.selection.active=false;
                }
                else
                {
                    this.statusBar.addChar(charToAdd);
                    this.selection.active=false;
                }

                return false;
            }
        }

        return true;
    }

    backSpace()
    {
        var str=this.lineArray[this.docTopline+this.cursory];

        if (str.length==0)
        {
            if (this.cursory==0)
            {
                return "";
            }
            else
            {
                this.cursory--;
                this.cursorx=this.lineArray[this.docTopline+this.cursory].length;
                return "\n";
            }
        }
        else
        {
            var removedChar=str[str.length-1];
            str=str.substring(0, str.length - 1);
            this.lineArray[this.docTopline+this.cursory]=str;
            this.cursorx--;
            return removedChar;
        }
    }

    rearrangeLines(curpos)
    {
        var curline=this.lineArray[curpos];
        var lastSpacePos=curline.lastIndexOf(" ");
        var newCurLine=curline.substring(0,lastSpacePos);
        var lastWord=curline.substring(lastSpacePos+1);
        this.lineArray[curpos]=newCurLine;

        if (this.lineArray.length==(curpos+1))
        {
            this.lineArray.push(lastWord);
            this.cursorx=lastWord.length;
        }
    }

    addChar(ch)
    {
        if (this.lineArray.length==0)
        {
            this.lineArray.push("");
        }

        this.lineArray[this.docTopline+this.cursory]+=ch;

        if (this.lineArray[this.docTopline+this.cursory].length==this.numColumns)
        {
            this.rearrangeLines(this.docTopline+this.cursory);
            this.cursory+=1;
            if (this.cursory==(this.numRows-1))
            {
                this.cursory--;
                this.docTopline++;
            }
        }
        else
        {
            this.cursorx++;
        }
    }

    drawLine(l,row)
    {
        for (var ch=0;ch<l.length;ch++)
        {
            this.fontManager.drawChar(ch,row,l[ch],1,false);
        }
    }

    drawCursor()
    {
        this.fontManager.drawCursor(this.cursorx,this.cursory,this.cursorTick,this.cursorSteps,false);
    }

    update()
    {
        this.cursorTick++;
        if (this.cursorTick>=this.cursorSteps)
        {
            this.cursorTick=0;
        }

        this.statusBar.updateCursor(this.cursory,this.cursorx,this.cursorTick,this.cursorSteps);
        this.statusBar.update();
    }

    draw()
    {
        // clear screen

        const canvas=document.getElementById(this.cnvsid);
        const context = canvas.getContext('2d');
        context.fillStyle = "#19432B";
        context.fillRect(0, 0, canvas.width, canvas.height);

        // draw eventual selection
        this.selection.update(this.lineArray);
        this.selection.draw();

        // draw lines of text

        var row=0;
        for (var line=this.docTopline;line<this.docTopline+this.numRows;line++)
        {
            if (line<this.lineArray.length)
            {
                this.drawLine(this.lineArray[line],row);
            }

            row++;
        }

        if (this.editorMode==0)
        {
            // draw cursor in editing space
            this.drawCursor();
        }

        // draw status bar
        this.statusBar.draw();

        // draw scrollbar
        this.scrollBar.draw();
    }
}
