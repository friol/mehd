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
        
        this.numColumns=80;
        this.numRows=22;

        this.statusBar=new statusbar(0,0,cnvsid,this.numRows,this.fontManager);

        window.addEventListener('keydown', this.handleKeyPress.bind(this));
    }

    handleKeyPress(e)
    {
        if (e.keyCode==8)
        {
            // backspace
            this.backSpace();
        }
        else if (e.keyCode==13)
        {
            // return
            this.cursory++;
            this.cursorx=0;
            this.lineArray.push("");
        }
        else if (e.keyCode==38)
        {
            // up
            if (this.cursory==0) return;
            this.cursory--;
        }
        else if ((e.keyCode>='A'.charCodeAt(0))&&(e.keyCode<='z'.charCodeAt(0)))
        {
            var kc=e.keyCode;
            if (!e.shiftKey) kc+=32;
            this.addChar(String.fromCharCode(kc));
            return false;
        }
        else if ((e.keyCode>=48)&&(e.keyCode<=57)&&(!e.shiftKey))
        {
            var kc=e.keyCode;
            this.addChar(String.fromCharCode(kc));
            return false;
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
                        this.addChar(this.keypressRemap[m][2]);
                    }
                    else
                    {
                        this.addChar(this.keypressRemap[m][1]);
                    }

                    return false;
                }
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
        this.fontManager.drawCursor(this.cursorx,this.cursory,this.cursorTick,this.cursorSteps);
    }

    update()
    {
        this.cursorTick++;
        if (this.cursorTick>=this.cursorSteps)
        {
            this.cursorTick=0;
        }

        this.statusBar.updateCursorPos(this.cursory,this.cursorx);
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

        // draw cursor
        this.drawCursor();

        // draw status bar
        this.statusBar.draw();
    }
}
