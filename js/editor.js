/* the main editor - friol 2k20 */

class editor
{
    constructor(cnvsid,edversion)
    {
        // theme: foreground, background, selection color
        this.colorPalette=["#83FFC7","#19432B","#3d9ab3"];

        // key remap: code, normal key, shift key, altgr key
        this.keypressRemap=[[190,'.',':'],[32,' ',' '],[219,'\'','?'],
            [186,'x','X','{'],[187,'+','*','}'],[188,',',';'],[220,'\\','|'],[189,'-','_'],
            [226,'<','>'],
            [48,'0','='],[49,'1','!'],[50,'2','"'],[51,'3','£'],[52,'4','$'],[53,'5','%'],
            [54,'6','&'],[55,'7','/'],[56,'8','('],[57,'9',')']
        ];

        this.cnvsid=cnvsid;
        this.edVersion=edversion;
        this.fontManager=new fontmgr(cnvsid,this.colorPalette[0],this.colorPalette[1],this.colorPalette[2]);

        this.lineArray=[""];
        
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
        var cnvsHeight=this.numRows*this.fontManager.fontheight+6+(this.numRows);

        document.getElementById(this.cnvsid).width=cnvsWidth;
        document.getElementById(this.cnvsid).height=cnvsHeight;

        // init some objects that will be usefull later

        this.scrollBar=new scrollbar(cnvsid,"arrowUp","arrowDown",this.fontManager.multiplier,this.fontManager.fontheight,this.colorPalette);
        this.statusBar=new statusbar(0,0,cnvsid,this.numRows,this.fontManager,this.numTotColumns);
        this.selection=new selection(cnvsid,this.numColumns,this.fontManager,this.lineArray);
        this.undoManager=new undomgr();
        
        this.picoDisplay=new vcdisplay(this.cnvsid);
        this.theLuaEngine=new luaengine(this.picoDisplay);

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
        if (cmd.split(" ")[0]=="test")
        {
            this.lineArray=[];

            if (cmd.split(" ").length!=2)
            {
                this.lineArray.push("-- 16 colorful bars");
                this.lineArray.push("cls(0)");
                this.lineArray.push("for c=0,15 do");
                this.lineArray.push("color(c)");
                this.lineArray.push("rectfill(0,c*8,128,c*8+8)");
                this.lineArray.push("flip()");
                this.lineArray.push("end");
            }
            else if (cmd.split(" ")[1]=="1")
            {
                this.lineArray.push("-- double loop test");
                this.lineArray.push("for i=0,16 do");
                this.lineArray.push("for j=0,16 do");
                this.lineArray.push("color(flr(rnd(16)))");
                this.lineArray.push("rectfill(j*8,i*8,j*8+8,i*8+8)");
                this.lineArray.push("end");
                this.lineArray.push("end");
                this.lineArray.push("flip()");
            }
            else if (cmd.split(" ")[1]=="2")
            {
                this.lineArray.push("-- 10print");
                this.lineArray.push("y=0");
                this.lineArray.push("c=7");
                this.lineArray.push("x=0");
                this.lineArray.push("cls(c)");
                this.lineArray.push("::jumphere::");
                this.lineArray.push("if rnd(2)>1 then");
                this.lineArray.push("line(x,y,x+c,y+c,1)");
                this.lineArray.push("else");
                this.lineArray.push("line(x,y+c,x+c,y,1)"); 
                this.lineArray.push("end");
                this.lineArray.push("x+=c");
                this.lineArray.push("if x>128 then");
                this.lineArray.push("x=0");
                this.lineArray.push("y+=c");
                this.lineArray.push("end");
                this.lineArray.push("flip()");
                this.lineArray.push("goto jumphere");
            }
            else if (cmd.split(" ")[1]=="3")
            {
                this.lineArray.push("-- sperm-like thingie");
                this.lineArray.push("tm=0");
                this.lineArray.push("::lab::");
                this.lineArray.push("for c=0,128 do");
                this.lineArray.push("cls(0)");
                this.lineArray.push("x0=64+(8*cos(tm))");
                this.lineArray.push("x1=64+(8*cos(tm-0.1))");
                this.lineArray.push("x2=64+(8*cos(tm-0.2))");
                this.lineArray.push("circfill(x0,c,16,7)");
                this.lineArray.push("circfill(x1,c-8,8,6)");
                this.lineArray.push("circfill(x2,c-16,4,5)");
                this.lineArray.push("tm+=0.01");
                this.lineArray.push("flip()");
                this.lineArray.push("end");
                this.lineArray.push("goto lab");
            }
            else if (cmd.split(" ")[1]=="4")
            {
                this.lineArray.push("-- tweetcart #1 - bars");
                this.lineArray.push("a=0");
                this.lineArray.push("tm=0");
                this.lineArray.push("pal(13,8)");
                this.lineArray.push("::cycle::");
                this.lineArray.push("cls()");
                this.lineArray.push("for p=128,0,-8 do");
                this.lineArray.push("b=a");
                this.lineArray.push("a=(p*0.9)+cos(tm*p)*19");
                this.lineArray.push("k=8+((p/8)%5)");
                this.lineArray.push("line(p,118-b,p,114-a,k+1)");
                this.lineArray.push("line(p,128,p,123-a,k)");
                this.lineArray.push("line(p+8,128,p+8,119-a,k)");
                this.lineArray.push("line(p-8,118-a,p,122-a,k)");
                this.lineArray.push("line(p+8,118-a,p,122-a,k)");
                this.lineArray.push("line(p-8,118-a,p,114-a,k)");
                this.lineArray.push("line(p+8,118-a,p,114-a,k)");
                this.lineArray.push("end");
                this.lineArray.push("tm+=0.0001");
                this.lineArray.push("flip()");
                this.lineArray.push("goto cycle");
            }
            else if (cmd.split(" ")[1]=="5")
            {
                this.lineArray.push("-- tweetcart #2 - DNA");
                this.lineArray.push("u=100");
                this.lineArray.push("f=0");
                this.lineArray.push("tm=0");
                this.lineArray.push("::cycle::");
                this.lineArray.push("cls(0)");
                this.lineArray.push("f+=1");
                this.lineArray.push("for y=0,126,9 do");
                this.lineArray.push("n=(y+tm*60)/u");
                this.lineArray.push("l=64+(sin((y+f)*0.004)*22)");
                this.lineArray.push("o=16*sin(n)");
                this.lineArray.push("z=0.9*sin(n+0.25)");
                this.lineArray.push("a=2");
                this.lineArray.push("m=3 ");
                this.lineArray.push("if z>0 then");
                this.lineArray.push("a=8");
                this.lineArray.push("m=1");
                this.lineArray.push("end");
                this.lineArray.push("line(l,y,l+o,y,a)");
                this.lineArray.push("line(l-o,y,l,y,m)");
                this.lineArray.push("if z>0 then");
                this.lineArray.push("z=z*2");
                this.lineArray.push("circfill(l-o,y,4-z,m)");
                this.lineArray.push("circfill(l+o,y,4+z,a)");
                this.lineArray.push("else"); 
                this.lineArray.push("circfill(l+o,y,4+z,a)");
                this.lineArray.push("circfill(l-o,y,4-z,m)");
                this.lineArray.push("end");
                this.lineArray.push("end");
                this.lineArray.push("flip()");
                this.lineArray.push("tm+=10");
                this.lineArray.push("goto cycle");
            }

            this.lineArray.push("");

            this.cursorx=0;
            this.cursory=this.lineArray.length-1;
            return "Program uploaded."
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
        else if ((cmd=="run")||(cmd=="r"))
        {
            // parse and run code
            this.theLuaEngine.parseAndRun(this.lineArray);
            return "Running.";
        }
        else if (cmd.split(" ")[0]=="theme")
        {
            if (cmd.split(" ").length!=2)
            {
                return "Theme command without argument.";
            }

            if (cmd.split(" ")[1]=="0")
            {
                this.colorPalette=["#83FFC7","#19432B","#3d9ab3"];
            }
            else if (cmd.split(" ")[1]=="1")
            {
                this.colorPalette=["#f0f0f0","#101010","#3d9ab3"];
            }
            else if (cmd.split(" ")[1]=="2")
            {
                this.colorPalette=["#657b83","#fdf6e3","#cec8b5"];
            }
            else
            {
                return "Valid themes: 0, 1 or 2.";
            }

            this.fontManager.setColors(this.colorPalette);
            this.fontManager.initFontCanvasArray();
            this.fontManager.initReverseCanvasArray();
            this.scrollBar.setColors(this.colorPalette);
            this.scrollBar.initArrowArray();
            return "Theme changed.";
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
        else if (e.keyCode==9)
        {
            // tab
            this.selection.active=false;

            if (this.editorMode==0)
            {
                this.lineArray[this.docTopline+this.cursory]+="    ";
                this.cursorx+=4;
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


                if (this.cursorx==0)
                {
                    this.lineArray.splice(this.cursory-1,0,"");
                }
                else if (this.cursorx==this.lineArray[this.cursory-1+this.docTopline].length)
                {
                    this.lineArray.splice(this.cursory,0,"");
                    this.cursorx=0;
                }
                else
                {
                    var prestr=this.lineArray[this.cursory-1+this.docTopline].substr(0,this.cursorx);
                    var poststr=this.lineArray[this.cursory-1+this.docTopline].substr(this.cursorx);
                    this.lineArray[this.cursory-1+this.docTopline]=prestr;
                    this.lineArray.splice(this.cursory,0,poststr);
                    this.cursorx=0;
                }
                
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
        else if (e.keyCode==35)
        {
            // end
            if (this.editorMode==0)
            {
                this.cursorx=this.lineArray[this.cursory+this.docTopline].length;
            }
        }
        else if (e.keyCode==36)
        {
            // beg
            if (this.editorMode==0)
            {
                this.cursorx=0;
            }
        }
        else if (e.keyCode==37)
        {
            // arrow left
            if (this.editorMode==0)
            {
                if (this.cursorx>0)
                {
                    this.cursorx--;
                }
                else if (this.cursory>0)
                {
                    this.cursory-=1;
                    this.cursorx=this.lineArray[this.cursory+this.docTopline].length;
                }
            }
        }
        else if (e.keyCode==39)
        {
            // arrow right
            if (this.editorMode==0)
            {
                if (this.cursorx<this.lineArray[this.cursory+this.docTopline].length)
                {
                    this.cursorx++;
                }
                else
                {
                    if (this.cursory<this.lineArray.length)
                    {
                        this.cursorx=0;
                        this.cursory+=1;
                    }
                }
            }
        }
        else if (e.keyCode==38)
        {
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

                if (this.cursorx>this.lineArray[this.cursory+this.docTopline].length)
                {
                    this.cursorx=this.lineArray[this.cursory+this.docTopline].length;
                }
            }
        }
        else if (e.keyCode==40)
        {
            // arrow down
            if (this.editorMode==0)
            {
                if (this.cursory<this.lineArray.length)
                {
                    if (this.cursory==(this.numRows-1))
                    {
                        this.docTopline++;
                    }
                    else
                    {
                        this.cursory++;
                    }
                }

                if (this.cursorx>this.lineArray[this.cursory+this.docTopline].length)
                {
                    this.cursorx=this.lineArray[this.cursory+this.docTopline].length;
                }
            }
        }
        else if (e.keyCode==46)
        {
            // "canc" (delete)
            if (this.editorMode==0)
            {
                if (this.cursorx<this.lineArray[this.cursory+this.docTopline].length)
                {
                    var prestr=this.lineArray[this.cursory+this.docTopline].substr(0,this.cursorx);
                    var poststr=this.lineArray[this.cursory+this.docTopline].substr(this.cursorx+1);
                    this.lineArray[this.cursory+this.docTopline]=prestr+poststr;
                }
                else
                {
                    if (this.cursory<this.lineArray.length)
                    {
                        var endline=this.lineArray[this.cursory+1+this.docTopline];
                        var startline=this.lineArray[this.cursory+this.docTopline];
                        this.lineArray.splice(this.cursory+1+this.docTopline,1);
                        this.lineArray[this.cursory+this.docTopline]+=endline;
                    }
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
                        if (e.shiftKey && !e.getModifierState("AltGraph"))
                        {
                            charToAdd=this.keypressRemap[m][2];
                            break;
                        }
                        else if (e.getModifierState("AltGraph"))
                        {
                            charToAdd=this.keypressRemap[m][3];    
                            break;
                        }
                        else
                        {
                            charToAdd=this.keypressRemap[m][1];
                            break;
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
                this.lineArray.splice(this.cursory+1+this.docTopline,1);
                return "\n";
            }
        }
        else
        {
            if (this.cursorx==this.lineArray[this.cursory+this.docTopline].length)
            {
                var removedChar=str[str.length-1];
                str=str.substring(0, str.length - 1);
                this.lineArray[this.docTopline+this.cursory]=str;
                this.cursorx--;
                return removedChar;
            }
            else
            {
                if (this.cursorx!=0)
                {
                    var removedChar=str[this.cursorx-1];
                    str=str.substring(0, this.cursorx - 1)+str.substring(this.cursorx);
                    this.lineArray[this.docTopline+this.cursory]=str;
                    this.cursorx--;
                    return removedChar;
                }
                else
                {
                    // concat previous line with current one
                    if (this.cursory!=0)
                    {
                        var endline=this.lineArray[this.cursory+this.docTopline];
                        var startline=this.lineArray[this.cursory-1+this.docTopline];
                        this.lineArray.splice(this.cursory+this.docTopline,1);
                        this.lineArray[this.cursory-1+this.docTopline]+=endline;
                        this.cursory--;
                        this.cursorx=startline.length;
                        return "";
                    }
                }
            }
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

        if (this.cursorx==this.lineArray[this.docTopline+this.cursory].length)
        {
            this.lineArray[this.docTopline+this.cursory]+=ch;
        }
        else
        {
            var linebeg=this.lineArray[this.docTopline+this.cursory].substr(0,this.cursorx);
            var lineend=this.lineArray[this.docTopline+this.cursory].substr(this.cursorx);
            this.lineArray[this.docTopline+this.cursory]=linebeg+ch+lineend;
        }

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
        context.fillStyle=this.colorPalette[1];
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

        // update&draw display
        this.picoDisplay.update();
        this.picoDisplay.draw();
    }
}
