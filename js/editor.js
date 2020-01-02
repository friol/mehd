/* the main editor */

class editor
{
    constructor(cnvsid)
    {
        this.keypressRemap=[[190,'.',':'],[32,' ',' '],[219,'\'','?'],
            [188,',',';'],[187,'+','*'],[220,'\\','|'],[189,'-','_'],
            [226,'<','>'],
            [48,'0','='],[49,'1','!'],[50,'2','"'],[51,'3','£'],[52,'4','$'],[53,'5','%'],
            [54,'6','&'],[55,'7','/'],[56,'8','('],[57,'9',')']
        ];

        this.cnvsid=cnvsid;
        this.fontManager=new fontmgr(cnvsid);

        this.lineArray=[];
        
        this.cursory=0;
        this.cursorx=0;
        this.cursorTick=0;
        this.cursorSteps=64;
        
        this.docTopline=0;
        
        this.numColumns=50;
        this.numRows=22;

        this.editorMode=0; // 0 - inserting text, 1 - command mode

        // resize canvas basing on columns/rows width

        var cnvsWidth=(this.numColumns*this.fontManager.fontwidth)+(this.numColumns*this.fontManager.multiplier);

        document.getElementById(this.cnvsid).width=cnvsWidth;


        this.statusBar=new statusbar(0,0,cnvsid,this.numRows,this.fontManager,this.numColumns);

        window.addEventListener('keydown', this.handleKeyPress.bind(this));
        window.addEventListener('dblclick', this.doubleClick.bind(this));
    }

    doubleClick(e)
    {
    }

    handleCommand(cmd)
    {
        if (cmd=="test")
        {
            this.lineArray=[];
            this.lineArray.push("Some sample of text.");
            this.lineArray.push("The quick brown palomb jumped over.");
            this.lineArray.push("<=ASCII-art=>");
            this.lineArray.push("");
            this.cursorx=0;
            this.cursory=3;
            return "Sample text uploaded."
        }
    }

    handleKeyPress(e)
    {
        if (e.keyCode==8)
        {
            // backspace
            if (this.editorMode==0)
            {
                this.backSpace();
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
            // return
            if (this.editorMode==0)
            {
                this.cursory++;
                this.cursorx=0;
                this.lineArray.push("");
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
            // arrow up
            if (this.editorMode==0)
            {
                if (this.cursory==0) return;
                this.cursory--;
            }
        }
        else
        {
            var charToAdd="";
            if ((e.keyCode>='A'.charCodeAt(0))&&(e.keyCode<='z'.charCodeAt(0)))
            {
                var kc=e.keyCode;
                if (!e.shiftKey) kc+=32;
                charToAdd=String.fromCharCode(kc);
            }
            else if ((e.keyCode>=48)&&(e.keyCode<=57)&&(!e.shiftKey))
            {
                var kc=e.keyCode;
                charToAdd=String.fromCharCode(kc);
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
                }
                else
                {
                    this.statusBar.addChar(charToAdd);
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
                return;
            }
            else
            {
                this.cursory--;
                this.cursorx=this.lineArray[this.docTopline+this.cursory].length;
            }
        }
        else
        {
            str=str.substring(0, str.length - 1);
            this.lineArray[this.docTopline+this.cursory]=str;
            this.cursorx--;
        }
    }

    addChar(ch)
    {
        if (this.lineArray.length==0)
        {
            this.lineArray.push("");
        }

        this.lineArray[this.docTopline+this.cursory]+=ch;
        this.cursorx++;
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
    }
}
